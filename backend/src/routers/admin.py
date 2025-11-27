from __future__ import annotations
from typing import Any, Dict, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, insert
from ..db import get_session
from ..repositories.admin import AdminRepository, calculate_quality_score
from ..services.enrichment import enrich_movie_from_query
from ..models import (
    Movie, Genre, Person, StreamingPlatform, MovieStreamingOption, movie_genres, movie_people, User
)
from ..dependencies.admin import require_admin
from ..schemas.curation import (
    CurationUpdate,
    CurationResponse,
    MovieCurationResponse,
    BulkUpdateRequest,
    BulkUpdateResponse,
    BulkPublishRequest,
    BulkFeatureRequest,
)

router = APIRouter(prefix="/admin", tags=["admin"])


class AdminUserOut(BaseModel):
    id: str
    name: str
    email: str
    roles: List[str]
    status: str
    joinedDate: str
    lastLogin: Optional[str] = None
    profileType: Optional[str] = None
    verificationStatus: Optional[str] = None
    accountType: Optional[str] = None
    phoneNumber: Optional[str] = None
    location: Optional[str] = None


class ModerationItemOut(BaseModel):
    id: str
    type: str
    contentTitle: str
    reportReason: Optional[str] = None
    status: str
    user: Optional[str] = None
    timestamp: str
    reports: int


class SettingsUpdateIn(BaseModel):
    data: Dict[str, Any]


class MovieCurationListResponse(BaseModel):
    """Response for paginated movie curation list"""
    items: List[MovieCurationResponse] = Field(description="List of movies with curation data")
    total: int = Field(description="Total count of movies matching filters")
    page: int = Field(description="Current page number")
    page_size: int = Field(description="Items per page")
    total_pages: int = Field(description="Total number of pages")

    class Config:
        from_attributes = True


class AnalyticsOverviewOut(BaseModel):
    totalUsers: int
    contentViews: int
    avgRating: float
    systemHealth: float
    changes: Dict[str, float]


@router.get("/users", response_model=List[AdminUserOut])
async def list_users(
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    admin_user: User = Depends(require_admin),
):
    repo = AdminRepository(session)
    return await repo.list_users(search=search, role=role, status=status, page=page, limit=limit)


@router.get("/moderation/items", response_model=List[ModerationItemOut])
async def list_moderation_items(
    status: Optional[str] = Query(None),
    contentType: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    admin_user: User = Depends(require_admin),
):
    repo = AdminRepository(session)
    return await repo.list_moderation_items(status=status, content_type=contentType, search=search, page=page, limit=limit)


class ModerationActionIn(BaseModel):
    reason: Optional[str] = None


@router.post("/moderation/items/{itemId}/approve")
async def approve_item(
    itemId: str,
    body: ModerationActionIn,
    session: AsyncSession = Depends(get_session),
    admin_user: User = Depends(require_admin),
):
    repo = AdminRepository(session)
    result = await repo.set_moderation_action(item_external_id=itemId, action="approve", reason=body.reason)
    if not result:
        raise HTTPException(status_code=404, detail="moderation_item_not_found")
    return result


@router.post("/moderation/items/{itemId}/reject")
async def reject_item(
    itemId: str,
    body: ModerationActionIn,
    session: AsyncSession = Depends(get_session),
    admin_user: User = Depends(require_admin),
):
    repo = AdminRepository(session)
    result = await repo.set_moderation_action(item_external_id=itemId, action="reject", reason=body.reason)
    if not result:
        raise HTTPException(status_code=404, detail="moderation_item_not_found")
    return result


@router.get("/system/settings")
async def get_settings(
    session: AsyncSession = Depends(get_session),
    admin_user: User = Depends(require_admin),
):
    repo = AdminRepository(session)
    return await repo.get_settings()


@router.put("/system/settings")
async def update_settings(
    body: SettingsUpdateIn,
    session: AsyncSession = Depends(get_session),
    admin_user: User = Depends(require_admin),
):
    repo = AdminRepository(session)
    return await repo.update_settings(data=body.data)


@router.get("/analytics/overview", response_model=AnalyticsOverviewOut)
async def analytics_overview(
    session: AsyncSession = Depends(get_session),
    admin_user: User = Depends(require_admin),
):
    repo = AdminRepository(session)
    return await repo.get_analytics_overview()


# ---------- JSON Import (Movies) ----------
class PersonIn(BaseModel):
    name: str
    role: Optional[str] = None  # director | writer | producer | actor
    character: Optional[str] = None
    image: Optional[str] = None

class StreamingIn(BaseModel):
    platform: str  # e.g., "netflix" or platform external_id/name
    region: str    # e.g., "US"
    type: str      # subscription | rent | buy | free
    price: Optional[float] = None
    quality: Optional[str] = None
    url: Optional[str] = None

class AwardSimpleIn(BaseModel):
    name: str
    year: int
    category: str
    status: str  # Winner | Nominee

class TriviaIn(BaseModel):
    question: str
    category: str
    answer: str
    explanation: Optional[str] = None

class TimelineIn(BaseModel):
    date: str  # YYYY-MM-DD
    title: str
    description: str
    type: str

class MovieImportIn(BaseModel):
    external_id: str
    title: str
    tagline: Optional[str] = None
    year: Optional[str] = None
    release_date: Optional[str] = None
    runtime: Optional[int] = None
    rating: Optional[str] = None
    siddu_score: Optional[float] = None
    critics_score: Optional[float] = None
    imdb_rating: Optional[float] = None
    rotten_tomatoes_score: Optional[float] = None
    language: Optional[str] = None
    country: Optional[str] = None
    overview: Optional[str] = None
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    budget: Optional[int] = None
    revenue: Optional[int] = None
    status: Optional[str] = None
    genres: Optional[List[str]] = None
    directors: Optional[List[PersonIn]] = None
    writers: Optional[List[PersonIn]] = None
    producers: Optional[List[PersonIn]] = None
    cast: Optional[List[PersonIn]] = None
    streaming: Optional[List[StreamingIn]] = None
    awards: Optional[List[AwardSimpleIn]] = None
    trivia: Optional[List[TriviaIn]] = None
    timeline: Optional[List[TimelineIn]] = None
    # Video playback fields
    video_url: Optional[str] = None
    video_source: Optional[str] = None
    is_free: Optional[bool] = None

# ---------- Enrichment (Gemini/TMDB) ----------
class EnrichQueryIn(BaseModel):
    query: str
    provider: Optional[str] = None  # "gemini" to enforce Gemini-only; otherwise default fallback chain

class EnrichBulkIn(BaseModel):
    queries: List[str]

class EnrichResultOut(BaseModel):
    external_id: str
    updated: bool
    provider_used: str

@router.post("/movies/enrich", response_model=EnrichResultOut)
async def enrich_via_query(
    body: EnrichQueryIn,
    session: AsyncSession = Depends(get_session),
    admin_user: User = Depends(require_admin),
):
    from ..services.enrichment import EnrichmentProviderError
    try:
        result = await enrich_movie_from_query(session, body.query, provider_preference=(body.provider or None))
        await session.commit()
        return EnrichResultOut(**result)
    except EnrichmentProviderError as e:
        await session.rollback()
        raise HTTPException(status_code=502, detail={"provider": e.provider, "error": e.message})

@router.post("/movies/enrich/bulk", response_model=List[EnrichResultOut])
async def enrich_bulk(
    body: EnrichBulkIn,
    session: AsyncSession = Depends(get_session),
    admin_user: User = Depends(require_admin),
):
    out: List[EnrichResultOut] = []
    for q in body.queries:
        try:
            result = await enrich_movie_from_query(session, q)
            out.append(EnrichResultOut(**result))
        except Exception as e:
            # skip but continue; in UI show failures separately if needed later
            out.append(EnrichResultOut(external_id=f"error:{q}", updated=False))
    await session.commit()
    return out

class EnrichExistingIn(BaseModel):
    external_id: str
    query: Optional[str] = None

@router.post("/movies/enrich-existing", response_model=EnrichResultOut)
async def enrich_existing(
    body: EnrichExistingIn,
    session: AsyncSession = Depends(get_session),
    admin_user: User = Depends(require_admin),
):
    # If query not provided, try using current movie title
    res = await session.execute(select(Movie).where(Movie.external_id == body.external_id))
    movie = res.scalar_one_or_none()
    if not movie:
        raise HTTPException(status_code=404, detail="movie_not_found")
    query = body.query or movie.title
    from ..services.enrichment import EnrichmentProviderError
    try:
        result = await enrich_movie_from_query(
            session, query, override_external_id=body.external_id, provider_preference=None
        )
        await session.commit()
        return EnrichResultOut(**result)
    except EnrichmentProviderError as e:
        await session.rollback()
        raise HTTPException(status_code=502, detail={"provider": e.provider, "error": e.message})


class ImportReportOut(BaseModel):
    imported: int
    updated: int
    failed: int
    errors: List[str]

@router.post("/movies/import", response_model=ImportReportOut)
async def import_movies_json(
    movies: List[MovieImportIn],
    session: AsyncSession = Depends(get_session),
    admin_user: User = Depends(require_admin),
):
    imported = 0
    updated = 0
    errors: List[str] = []

    async def get_or_create_genre(name: str) -> Genre:
        q = select(Genre).where(Genre.name.ilike(name))
        res = await session.execute(q)
        g = res.scalar_one_or_none()
        if g:
            return g
        g = Genre(name=name, slug=name.lower().replace(" ", "-"))
        session.add(g)
        await session.flush()
        return g

    async def get_or_create_person(name: str, image: Optional[str] = None) -> Person:
        q = select(Person).where(Person.name.ilike(name))
        res = await session.execute(q)
        p = res.scalar_one_or_none()
        if p:
            if image and not p.image_url:
                p.image_url = image
            return p
        p = Person(external_id=f"person-{name.lower().replace(' ', '-')}", name=name, image_url=image)
        session.add(p)
        await session.flush()
        return p

    async def get_or_create_platform(key: str) -> StreamingPlatform:
        q = select(StreamingPlatform).where(StreamingPlatform.name.ilike(key))
        res = await session.execute(q)
        plat = res.scalar_one_or_none()
        if plat:
            return plat
        plat = StreamingPlatform(external_id=key.lower(), name=key, logo_url=None, website_url=None)
        session.add(plat)
        await session.flush()
        return plat

    # Awards helpers
    from ..models import AwardCeremony, AwardCeremonyYear, AwardCategory, AwardNomination

    def _slug(s: str) -> str:
        import re
        return re.sub(r"[^a-z0-9-]", "", re.sub(r"\s+", "-", s.strip().lower()))

    async def get_or_create_ceremony(name: str) -> AwardCeremony:
        q = select(AwardCeremony).where(AwardCeremony.name.ilike(name))
        res = await session.execute(q)
        c = res.scalar_one_or_none()
        if c:
            return c
        c = AwardCeremony(external_id=_slug(name), name=name, short_name=name)
        session.add(c)
        await session.flush()
        return c

    async def get_or_create_ceremony_year(ceremony: AwardCeremony, year: int) -> AwardCeremonyYear:
        ext = f"{ceremony.external_id}-{year}"
        q = select(AwardCeremonyYear).where(AwardCeremonyYear.external_id == ext)
        res = await session.execute(q)
        y = res.scalar_one_or_none()
        if y:
            return y
        y = AwardCeremonyYear(external_id=ext, year=year, ceremony_id=ceremony.id)
        session.add(y)
        await session.flush()
        return y

    async def get_or_create_category(cyear: AwardCeremonyYear, name: str) -> AwardCategory:
        ext = f"{cyear.external_id}-{_slug(name)}"
        q = select(AwardCategory).where(AwardCategory.external_id == ext)
        res = await session.execute(q)
        cat = res.scalar_one_or_none()
        if cat:
            return cat
        cat = AwardCategory(external_id=ext, name=name, ceremony_year_id=cyear.id)
        session.add(cat)
        await session.flush()
        return cat

    for idx, m in enumerate(movies):
        try:
            # Upsert Movie by external_id
            res = await session.execute(select(Movie).where(Movie.external_id == m.external_id))
            movie = res.scalar_one_or_none()
            is_update = movie is not None
            if not movie:
                movie = Movie(external_id=m.external_id, title=m.title)
                session.add(movie)

            # Update fields
            movie.title = m.title
            movie.tagline = m.tagline
            movie.year = m.year
            movie.runtime = m.runtime
            movie.rating = m.rating
            movie.siddu_score = m.siddu_score
            movie.critics_score = m.critics_score
            movie.imdb_rating = m.imdb_rating
            movie.rotten_tomatoes_score = m.rotten_tomatoes_score
            movie.language = m.language
            movie.country = m.country
            movie.overview = m.overview
            movie.poster_url = m.poster_url
            movie.backdrop_url = m.backdrop_url
            movie.budget = m.budget
            movie.revenue = m.revenue
            movie.status = m.status
            if m.release_date:
                from datetime import datetime
                try:
                    movie.release_date = datetime.fromisoformat(m.release_date)
                except Exception:
                    movie.release_date = None
            
            # Video playback fields
            if m.video_url is not None:
                movie.video_url = m.video_url
            if m.video_source is not None:
                movie.video_source = m.video_source
            if m.is_free is not None:
                movie.is_free = m.is_free

            # Ensure movie.id is available before linking associations
            await session.flush()

            # Genres - operate on association table directly to avoid async lazy-load issues
            if m.genres is not None:
                try:
                    await session.execute(
                        movie_genres.delete().where(movie_genres.c.movie_id == movie.id)
                    )
                    await session.flush()
                    for gname in m.genres:
                        g = await get_or_create_genre(gname)
                        await session.execute(
                            movie_genres.insert().values(movie_id=movie.id, genre_id=g.id)
                        )
                except Exception as ge:
                    errors.append(f"genres for {movie.external_id}: {ge}")

            # People (clear and re-link)
            if any([m.directors, m.writers, m.producers, m.cast]):
                await session.execute(
                    movie_people.delete().where(movie_people.c.movie_id == movie.id)
                )
                await session.flush()

                # Track inserted person_ids to avoid duplicates
                inserted_person_ids = set()

                async def link_person(per: PersonIn, role: str, character: Optional[str] = None):
                    p = await get_or_create_person(per.name, per.image)

                    # Only insert if this person hasn't been linked yet
                    if p.id not in inserted_person_ids:
                        await session.execute(
                            movie_people.insert().values(
                                movie_id=movie.id,
                                person_id=p.id,
                                role=role,
                                character_name=character,
                            )
                        )
                        inserted_person_ids.add(p.id)

                if m.directors:
                    for per in m.directors:
                        await link_person(per, "director")
                if m.writers:
                    for per in m.writers:
                        await link_person(per, "writer")
                if m.producers:
                    for per in m.producers:
                        await link_person(per, "producer")
                if m.cast:
                    for per in m.cast:
                        await link_person(per, "actor", per.character)

            # Streaming options
            if m.streaming is not None:
                await session.execute(
                    select(MovieStreamingOption).where(MovieStreamingOption.movie_id == movie.id)
                )
                # delete existing
                await session.execute(
                    MovieStreamingOption.__table__.delete().where(MovieStreamingOption.movie_id == movie.id)
                )
                await session.flush()
                for i, s in enumerate(m.streaming):
                    plat = await get_or_create_platform(s.platform)
                    ext_id = f"{movie.external_id}-{plat.external_id}-{s.region}-{i}"
                    opt = MovieStreamingOption(
                        external_id=ext_id,
                        movie_id=movie.id,
                        platform_id=plat.id,
                        region=s.region,
                        type=s.type,
                        price=s.price,
                        quality=s.quality,
                        url=s.url,
                        verified=True,
                    )
                    session.add(opt)

            # Awards import (optional)
            if m.awards:
                for a in m.awards:
                    try:
                        ceremony = await get_or_create_ceremony(a.name)
                        cyear = await get_or_create_ceremony_year(ceremony, int(a.year))
                        cat = await get_or_create_category(cyear, a.category)
                        nom_ext = f"{cyear.external_id}-{_slug(a.category)}-{movie.external_id}"
                        # ensure id uniqueness by appending counter if needed omitted for brevity
                        nomination = AwardNomination(
                            external_id=nom_ext,
                            nominee_type="movie",
                            nominee_name=movie.title,
                            image_url=None,
                            entity_url=None,
                            details=None,
                            is_winner=(str(a.status).lower().startswith("win")),
                            category_id=cat.id,
                            movie_id=movie.id,
                            person_id=None,
                        )
                        session.add(nomination)
                    except Exception as _awde:
                        errors.append(f"award for {movie.external_id}: {_awde}")

            # Trivia & Timeline JSONB (optional)
            if m.trivia is not None:
                # store as list of dicts
                movie.trivia = [
                    {
                        "question": t.question,
                        "category": t.category,
                        "answer": t.answer,
                        "explanation": getattr(t, "explanation", None),
                    }
                    for t in m.trivia
                ]
            if m.timeline is not None:
                movie.timeline = [
                    {
                        "date": tl.date,
                        "title": tl.title,
                        "description": tl.description,
                        "type": tl.type,
                    }
                    for tl in m.timeline
                ]

            if is_update:
                updated += 1
            else:
                imported += 1

            # Commit after each movie to avoid transaction rollback issues
            await session.commit()
        except Exception as e:
            # Rollback this movie's transaction and continue with next
            await session.rollback()
            errors.append(f"{m.external_id}: {e}")

    return ImportReportOut(imported=imported, updated=updated, failed=len(errors), errors=errors)


# ============================================================================
# PHASE 3: MOVIE CURATION ENDPOINTS
# ============================================================================

@router.get(
    "/movies",
    response_model=MovieCurationListResponse,
    dependencies=[Depends(require_admin)],
    summary="Get paginated movies for curation",
    description="Retrieve paginated list of movies with curation data, filters, and sorting",
    tags=["admin-curation"]
)
async def get_movies_for_curation(
    session: AsyncSession = Depends(get_session),
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(default=25, ge=1, le=100, description="Items per page"),
    curation_status: Optional[str] = Query(
        default=None,
        description="Filter by curation status: draft, pending_review, approved, rejected"
    ),
    sort_by: str = Query(
        default="curated_at",
        description="Sort field: quality_score, curated_at"
    ),
    sort_order: str = Query(
        default="desc",
        description="Sort direction: asc, desc"
    ),
) -> MovieCurationListResponse:
    """
    Get paginated movies for curation with optional filtering and sorting.

    **Filters:**
    - `curation_status`: Filter by draft, pending_review, approved, or rejected

    **Sorting:**
    - `sort_by`: quality_score or curated_at
    - `sort_order`: asc or desc

    **Pagination:**
    - `page`: Page number (1-indexed)
    - `page_size`: Items per page (1-100)

    **Requires:** Admin role
    """
    repo = AdminRepository(session)

    # Validate sort_by parameter
    if sort_by not in ["quality_score", "curated_at"]:
        sort_by = "curated_at"

    # Validate sort_order parameter
    if sort_order.lower() not in ["asc", "desc"]:
        sort_order = "desc"

    # Get movies and total count
    movies, total_count = await repo.get_movies_for_curation(
        page=page,
        page_size=page_size,
        curation_status=curation_status,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    # Calculate total pages
    total_pages = (total_count + page_size - 1) // page_size

    # Convert movies to response schema
    items = [
        MovieCurationResponse(
            id=movie.id,
            external_id=movie.external_id,
            title=movie.title,
            year=movie.year,
            curation=CurationResponse(
                curation_status=movie.curation_status,
                quality_score=movie.quality_score,
                curator_notes=movie.curator_notes,
                curated_by_id=movie.curated_by_id,
                curated_at=movie.curated_at,
                last_reviewed_at=movie.last_reviewed_at,
                curated_by={
                    "id": movie.curated_by.id,
                    "name": movie.curated_by.name,
                    "email": movie.curated_by.email,
                } if movie.curated_by else None,
            ),
        )
        for movie in movies
    ]

    return MovieCurationListResponse(
        items=items,
        total=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.patch(
    "/movies/{movie_id}/curation",
    response_model=MovieCurationResponse,
    dependencies=[Depends(require_admin)],
    summary="Update movie curation",
    description="Update curation status, quality score, and notes for a movie",
    tags=["admin-curation"]
)
async def update_movie_curation(
    movie_id: int,
    curation_data: CurationUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_admin),
) -> MovieCurationResponse:
    """
    Update movie curation fields and set curator/timestamps.

    **Updates:**
    - `curation_status`: draft, pending_review, approved, rejected
    - `quality_score`: 0-100
    - `curator_notes`: Text notes from curator

    **Automatic:**
    - `curated_by_id`: Set to current admin user
    - `curated_at`: Set on first curation only
    - `last_reviewed_at`: Updated on every change

    **Requires:** Admin role
    """
    repo = AdminRepository(session)

    # Update movie curation
    movie = await repo.update_movie_curation(
        movie_id=movie_id,
        curation_status=curation_data.curation_status,
        quality_score=curation_data.quality_score,
        curator_notes=curation_data.curator_notes,
        curator_id=current_user.id,
    )

    if not movie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Movie with ID {movie_id} not found",
        )

    # Return updated movie
    return MovieCurationResponse(
        id=movie.id,
        external_id=movie.external_id,
        title=movie.title,
        year=movie.year,
        curation=CurationResponse(
            curation_status=movie.curation_status,
            quality_score=movie.quality_score,
            curator_notes=movie.curator_notes,
            curated_by_id=movie.curated_by_id,
            curated_at=movie.curated_at,
            last_reviewed_at=movie.last_reviewed_at,
            curated_by={
                "id": movie.curated_by.id,
                "name": movie.curated_by.name,
                "email": movie.curated_by.email,
            } if movie.curated_by else None,
        ),
    )


# ============================================================================
# PHASE 5: BULK OPERATIONS
# ============================================================================


@router.post(
    "/movies/bulk-update",
    response_model=BulkUpdateResponse,
    dependencies=[Depends(require_admin)],
    summary="Bulk update movie curation",
    description="Update curation fields for multiple movies at once",
    tags=["admin-curation"]
)
async def bulk_update_movies_endpoint(
    request: BulkUpdateRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_admin),
) -> BulkUpdateResponse:
    """
    Bulk update movie curation fields for multiple movies.

    **Request:**
    - `movie_ids`: List of movie IDs to update (required, min 1)
    - `curation_data`: Curation fields to apply to all movies

    **Response:**
    - `success_count`: Number of movies successfully updated
    - `failure_count`: Number of movies that failed to update
    - `failed_ids`: List of movie IDs that failed
    - `message`: Summary message

    **Requires:** Admin role
    """
    repo = AdminRepository(session)

    # Convert CurationUpdate to dict
    curation_dict = request.curation_data.model_dump(exclude_none=True)

    # Perform bulk update
    success_count, failure_count, failed_ids = await repo.bulk_update_movies(
        movie_ids=request.movie_ids,
        curation_data=curation_dict,
        curator_id=current_user.id,
    )

    # Generate message
    if failure_count == 0:
        message = f"Successfully updated {success_count} movie(s)"
    else:
        message = f"Updated {success_count} movie(s), {failure_count} failed"

    return BulkUpdateResponse(
        success_count=success_count,
        failure_count=failure_count,
        failed_ids=failed_ids,
        message=message,
    )


@router.post(
    "/movies/bulk-publish",
    response_model=BulkUpdateResponse,
    dependencies=[Depends(require_admin)],
    summary="Bulk publish/unpublish movies",
    description="Publish or unpublish multiple movies at once",
    tags=["admin-curation"]
)
async def bulk_publish_movies_endpoint(
    request: BulkPublishRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_admin),
) -> BulkUpdateResponse:
    """
    Bulk publish or unpublish movies.

    **Request:**
    - `movie_ids`: List of movie IDs to publish/unpublish (required, min 1)
    - `publish`: True to publish (set status to approved), False to unpublish (set to draft)

    **Response:**
    - `success_count`: Number of movies successfully updated
    - `failure_count`: Number of movies that failed to update
    - `failed_ids`: List of movie IDs that failed
    - `message`: Summary message

    **Requires:** Admin role
    """
    repo = AdminRepository(session)

    # Perform bulk publish/unpublish
    success_count, failure_count, failed_ids = await repo.bulk_publish_movies(
        movie_ids=request.movie_ids,
        publish=request.publish,
        curator_id=current_user.id,
    )

    # Generate message
    action = "published" if request.publish else "unpublished"
    if failure_count == 0:
        message = f"Successfully {action} {success_count} movie(s)"
    else:
        message = f"{action.capitalize()} {success_count} movie(s), {failure_count} failed"

    return BulkUpdateResponse(
        success_count=success_count,
        failure_count=failure_count,
        failed_ids=failed_ids,
        message=message,
    )


@router.post(
    "/movies/bulk-feature",
    response_model=BulkUpdateResponse,
    dependencies=[Depends(require_admin)],
    summary="Bulk feature/unfeature movies",
    description="Feature or unfeature multiple movies at once",
    tags=["admin-curation"]
)
async def bulk_feature_movies_endpoint(
    request: BulkFeatureRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(require_admin),
) -> BulkUpdateResponse:
    """
    Bulk feature or unfeature movies.

    Note: This currently sets curation_status to approved/draft as a placeholder.
    Will be updated when 'is_featured' field is added to Movie model.

    **Request:**
    - `movie_ids`: List of movie IDs to feature/unfeature (required, min 1)
    - `featured`: True to feature, False to unfeature

    **Response:**
    - `success_count`: Number of movies successfully updated
    - `failure_count`: Number of movies that failed to update
    - `failed_ids`: List of movie IDs that failed
    - `message`: Summary message

    **Requires:** Admin role
    """
    repo = AdminRepository(session)

    # Perform bulk feature/unfeature
    success_count, failure_count, failed_ids = await repo.bulk_feature_movies(
        movie_ids=request.movie_ids,
        featured=request.featured,
        curator_id=current_user.id,
    )

    # Generate message
    action = "featured" if request.featured else "unfeatured"
    if failure_count == 0:
        message = f"Successfully {action} {success_count} movie(s)"
    else:
        message = f"{action.capitalize()} {success_count} movie(s), {failure_count} failed"

    return BulkUpdateResponse(
        success_count=success_count,
        failure_count=failure_count,
        failed_ids=failed_ids,
        message=message,
    )


# ============================================================================
# PHASE 4: IMPORT SCHEMA & TEMPLATE GENERATOR
# ============================================================================


class ImportSchemaField(BaseModel):
    """Schema field definition"""
    name: str
    type: str
    required: bool
    description: str
    example: Any = None
    enum_values: Optional[List[str]] = None


class ImportSchemaResponse(BaseModel):
    """Complete import schema documentation"""
    version: str
    description: str
    fields: List[ImportSchemaField]
    example: Dict[str, Any]


@router.get(
    "/import/schema",
    response_model=ImportSchemaResponse,
    summary="Get movie import schema",
    description="Get the complete JSON schema for movie imports",
    tags=["admin-import"]
)
async def get_import_schema() -> ImportSchemaResponse:
    """
    Get the complete JSON schema for movie imports.

    This endpoint returns the schema definition for importing movies,
    including field names, types, requirements, and examples.
    """
    return ImportSchemaResponse(
        version="1.0.0",
        description="Movie import schema for bulk movie uploads",
        fields=[
            ImportSchemaField(
                name="external_id",
                type="string",
                required=True,
                description="Unique external identifier (e.g., tmdb-123456)",
                example="tmdb-550"
            ),
            ImportSchemaField(
                name="title",
                type="string",
                required=True,
                description="Movie title",
                example="Fight Club"
            ),
            ImportSchemaField(
                name="year",
                type="string",
                required=False,
                description="Release year (YYYY format)",
                example="1999"
            ),
            ImportSchemaField(
                name="release_date",
                type="string",
                required=False,
                description="Release date (YYYY-MM-DD format)",
                example="1999-10-15"
            ),
            ImportSchemaField(
                name="runtime",
                type="integer",
                required=False,
                description="Runtime in minutes",
                example=139
            ),
            ImportSchemaField(
                name="rating",
                type="string",
                required=False,
                description="Content rating (G, PG, PG-13, R, NC-17)",
                example="R"
            ),
            ImportSchemaField(
                name="overview",
                type="string",
                required=False,
                description="Plot overview/synopsis",
                example="An insomniac office worker and a devil-may-care soapmaker form an underground fight club..."
            ),
            ImportSchemaField(
                name="tagline",
                type="string",
                required=False,
                description="Movie tagline",
                example="Lose yourself"
            ),
            ImportSchemaField(
                name="poster_url",
                type="string",
                required=False,
                description="URL to poster image",
                example="https://example.com/poster.jpg"
            ),
            ImportSchemaField(
                name="backdrop_url",
                type="string",
                required=False,
                description="URL to backdrop image",
                example="https://example.com/backdrop.jpg"
            ),
            ImportSchemaField(
                name="genres",
                type="array[string]",
                required=False,
                description="List of genres",
                example=["Drama", "Thriller"]
            ),
            ImportSchemaField(
                name="siddu_score",
                type="number",
                required=False,
                description="Siddu Global score (0-10)",
                example=8.8
            ),
            ImportSchemaField(
                name="critics_score",
                type="number",
                required=False,
                description="Critics score (0-100)",
                example=67.0
            ),
            ImportSchemaField(
                name="imdb_rating",
                type="number",
                required=False,
                description="IMDb rating (0-10)",
                example=8.8
            ),
            ImportSchemaField(
                name="rotten_tomatoes_score",
                type="number",
                required=False,
                description="Rotten Tomatoes score (0-100)",
                example=67.0
            ),
            ImportSchemaField(
                name="directors",
                type="array[object]",
                required=False,
                description="List of directors with name and optional image URL",
                example=[{"name": "David Fincher", "image": None}]
            ),
            ImportSchemaField(
                name="cast",
                type="array[object]",
                required=False,
                description="List of cast members with name, character, and optional image URL",
                example=[{"name": "Brad Pitt", "character": "Tyler Durden", "image": None}]
            ),
            ImportSchemaField(
                name="writers",
                type="array[object]",
                required=False,
                description="List of writers with name and optional image URL",
                example=[{"name": "Jim Uhls", "image": None}]
            ),
            ImportSchemaField(
                name="producers",
                type="array[object]",
                required=False,
                description="List of producers with name and optional image URL",
                example=[{"name": "Art Linson", "image": None}]
            ),
        ],
        example={
            "external_id": "tmdb-550",
            "title": "Fight Club",
            "year": "1999",
            "release_date": "1999-10-15",
            "runtime": 139,
            "rating": "R",
            "overview": "An insomniac office worker and a devil-may-care soapmaker form an underground fight club...",
            "tagline": "Lose yourself",
            "poster_url": "https://example.com/poster.jpg",
            "backdrop_url": "https://example.com/backdrop.jpg",
            "genres": ["Drama", "Thriller"],
            "siddu_score": 8.8,
            "critics_score": 67.0,
            "imdb_rating": 8.8,
            "rotten_tomatoes_score": 67.0,
            "directors": [{"name": "David Fincher", "image": None}],
            "cast": [{"name": "Brad Pitt", "character": "Tyler Durden", "image": None}],
            "writers": [{"name": "Jim Uhls", "image": None}],
            "producers": [{"name": "Art Linson", "image": None}],
        }
    )


class ImportTemplateResponse(BaseModel):
    """Import template response"""
    template: List[Dict[str, Any]]
    description: str


@router.get(
    "/import/template",
    response_model=ImportTemplateResponse,
    summary="Get movie import template",
    description="Get a sample JSON template for movie imports",
    tags=["admin-import"]
)
async def get_import_template() -> ImportTemplateResponse:
    """
    Get a sample JSON template for movie imports.

    This endpoint returns a ready-to-use template that can be copied
    and filled in with actual movie data.
    """
    return ImportTemplateResponse(
        description="Sample movie import template - copy and modify as needed",
        template=[
            {
                "external_id": "tmdb-550",
                "title": "Fight Club",
                "year": "1999",
                "release_date": "1999-10-15",
                "runtime": 139,
                "rating": "R",
                "overview": "An insomniac office worker and a devil-may-care soapmaker form an underground fight club that evolves into much more.",
                "tagline": "Lose yourself",
                "poster_url": "https://example.com/poster.jpg",
                "backdrop_url": "https://example.com/backdrop.jpg",
                "genres": ["Drama", "Thriller"],
                "siddu_score": 8.8,
                "critics_score": 67.0,
                "imdb_rating": 8.8,
                "rotten_tomatoes_score": 67.0,
                "directors": [{"name": "David Fincher", "image": None}],
                "cast": [
                    {"name": "Brad Pitt", "character": "Tyler Durden", "image": None},
                    {"name": "Edward Norton", "character": "The Narrator", "image": None},
                ],
                "writers": [{"name": "Jim Uhls", "image": None}],
                "producers": [{"name": "Art Linson", "image": None}],
            }
        ]
    )

