from __future__ import annotations

from typing import Any, List, Optional
from sqlalchemy import select, desc, asc, or_, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..models import Movie, Genre, Review, Scene, MovieStreamingOption, StreamingPlatform


class MovieRepository:
    def __init__(self, session: AsyncSession | None) -> None:
        self.session = session

    async def list(
        self,
        *,
        page: int = 1,
        limit: int = 20,
        genre_slug: Optional[str] = None,
        year_min: Optional[int] = None,
        year_max: Optional[int] = None,
        countries: Optional[list[str]] = None,
        languages: Optional[list[str]] = None,
        rating_min: Optional[float] = None,
        rating_max: Optional[float] = None,
        sort_by: Optional[str] = None,
    ) -> List[dict[str, Any]]:
        if not self.session:
            return []
        q = select(Movie)
        if genre_slug:
            q = q.join(Movie.genres).where(Genre.slug == genre_slug)
        if year_min is not None:
            q = q.where(Movie.year >= str(year_min))
        if year_max is not None:
            q = q.where(Movie.year <= str(year_max))
        if countries:
            q = q.where(Movie.country.in_(countries))
        if languages:
            q = q.where(Movie.language.in_(languages))
        if rating_min is not None:
            q = q.where(Movie.siddu_score >= rating_min)
        if rating_max is not None:
            q = q.where(Movie.siddu_score <= rating_max)
        # sorting
        if sort_by == "latest":
            q = q.order_by(desc(Movie.year))
        elif sort_by in ("score", "rating"):
            q = q.order_by(desc(Movie.siddu_score))
        elif sort_by == "popular":
            q = q.order_by(desc(Movie.siddu_score))
        elif sort_by == "alphabetical":
            q = q.order_by(asc(Movie.title))
        elif sort_by == "alphabetical-desc":
            q = q.order_by(desc(Movie.title))
        q = q.limit(limit).offset((page - 1) * limit)
        res = await self.session.execute(q)
        movies = res.scalars().all()
        return [
            {
                "id": m.external_id,
                "title": m.title,
                "year": m.year,
                "releaseDate": m.release_date.isoformat() if m.release_date else None,
                "posterUrl": m.poster_url,
                "genres": [g.name for g in m.genres],
                "sidduScore": m.siddu_score,
                "language": m.language,
                "country": m.country,
                "runtime": m.runtime,
            }
            for m in movies
        ]

    async def get(self, external_id: str) -> dict[str, Any] | None:
        if not self.session:
            return None
        q = select(Movie).where(Movie.external_id == external_id)
        res = await self.session.execute(q)
        m = res.scalar_one_or_none()
        if not m:
            return None

        # Get directors, writers, producers from people relationship
        directors = []
        writers = []
        producers = []
        cast = []

        from sqlalchemy import select as _select
        from ..models import movie_people, Person

        # Query movie_people association table
        people_query = _select(Person, movie_people.c.role, movie_people.c.character_name).join(
            movie_people, Person.id == movie_people.c.person_id
        ).where(movie_people.c.movie_id == m.id)

        people_result = await self.session.execute(people_query)
        for person, role, character_name in people_result:
            person_dict = {
                "id": person.external_id,
                "name": person.name,
                "role": role,
                "profileUrl": person.image_url,
            }

            if role == "director":
                directors.append(person_dict)
            elif role == "writer":
                writers.append(person_dict)
            elif role == "producer":
                producers.append(person_dict)
            elif role == "actor":
                person_dict["character"] = character_name
                cast.append(person_dict)

        # Get reviews
        reviews_query = select(Review).where(Review.movie_id == m.id).limit(10)
        reviews_result = await self.session.execute(reviews_query)
        reviews_list = []
        for review in reviews_result.scalars():
            reviews_list.append({
                "id": review.external_id,
                "userId": review.author.external_id if review.author else None,
                "username": review.author.name if review.author else "Anonymous",
                "avatarUrl": review.author.avatar_url if review.author else None,
                "rating": review.rating,
                "title": review.title,
                "content": review.content,
                "verified": review.is_verified,
                "containsSpoilers": review.has_spoilers,
                "helpfulCount": review.helpful_votes,
                "createdAt": review.date.isoformat() if review.date else None,
            })

        # Get scenes
        scenes_query = select(Scene).where(Scene.movie_id == m.id).limit(20)
        scenes_result = await self.session.execute(scenes_query)
        scenes_list = []
        for scene in scenes_result.scalars():
            scenes_list.append({
                "id": scene.external_id,
                "title": scene.title,
                "description": scene.description,
                "thumbnailUrl": scene.thumbnail_url,
                "timestamp": scene.duration_str,
                "type": scene.scene_type,
            })

        # Get streaming options grouped by region
        streaming_query = select(MovieStreamingOption, StreamingPlatform).join(
            StreamingPlatform, MovieStreamingOption.platform_id == StreamingPlatform.id
        ).where(MovieStreamingOption.movie_id == m.id)
        streaming_result = await self.session.execute(streaming_query)

        streaming_by_region = {}
        for stream_opt, platform in streaming_result:
            region = stream_opt.region
            if region not in streaming_by_region:
                streaming_by_region[region] = []

            streaming_by_region[region].append({
                "provider": platform.name,
                "logoUrl": platform.logo_url,
                "type": stream_opt.type,
                "price": stream_opt.price,
                "quality": stream_opt.quality,
                "url": stream_opt.url,
                "verified": stream_opt.verified,
            })

        return {
            "id": m.external_id,
            "title": m.title,
            "tagline": m.tagline,
            "year": m.year,
            "releaseDate": m.release_date.isoformat() if m.release_date else None,
            "runtime": m.runtime,
            "rating": m.rating,
            "posterUrl": m.poster_url,
            "backdropUrl": m.backdrop_url,
            "genres": [g.name for g in m.genres],
            "genreSlugs": [g.slug for g in m.genres],
            "sidduScore": m.siddu_score,
            "criticsScore": m.critics_score,
            "imdbRating": m.imdb_rating,
            "rottenTomatoesScore": m.rotten_tomatoes_score,
            "language": m.language,
            "country": m.country,
            "synopsis": m.overview,
            "budget": m.budget,
            "revenue": m.revenue,
            "status": m.status,
            # Return published data OR draft data (prefer draft for admin editing)
            "trivia": m.trivia_draft if m.trivia_draft else m.trivia,
            "timeline": m.timeline_draft if m.timeline_draft else m.timeline,
            "awards": m.awards_draft if m.awards_draft else m.awards,
            "directors": directors,
            "writers": writers,
            "producers": producers,
            "cast": cast,
            "reviews": reviews_list,
            "scenes": scenes_list,
            "streamingOptions": streaming_by_region,
        }

    async def search(
        self,
        query: str,
        limit: int = 10,
    ) -> List[dict[str, Any]]:
        """
        Search movies by title or description.
        Returns results ordered by relevance (exact title match first, then partial matches).
        """
        if not self.session or not query:
            return []

        # Normalize query for case-insensitive search
        search_term = f"%{query}%"

        # Build search query - search in title and overview only
        # This avoids the DISTINCT issue with genre joins
        q = (
            select(Movie)
            .where(
                or_(
                    func.lower(Movie.title).like(func.lower(search_term)),
                    func.lower(Movie.overview).like(func.lower(search_term)),
                )
            )
            .order_by(
                # Exact match (case-insensitive)
                desc(func.lower(Movie.title) == func.lower(query)),
                # Starts with query
                desc(func.lower(Movie.title).like(func.lower(f"{query}%"))),
                # Then by popularity (siddu_score)
                desc(Movie.siddu_score),
                # Then by year (newest first)
                desc(Movie.year),
            )
            .limit(limit)
        )

        res = await self.session.execute(q)
        movies = res.scalars().all()

        return [
            {
                "id": m.external_id,
                "title": m.title,
                "year": m.year,
                "posterUrl": m.poster_url,
                "genres": [g.name for g in m.genres],
                "sidduScore": m.siddu_score,
                "runtime": m.runtime,
            }
            for m in movies
        ]

    async def get_movie_by_external_id(self, external_id: str) -> Movie | None:
        """Get movie model by external ID"""
        if not self.session:
            return None
        q = select(Movie).where(Movie.external_id == external_id)
        res = await self.session.execute(q)
        return res.scalar_one_or_none()

