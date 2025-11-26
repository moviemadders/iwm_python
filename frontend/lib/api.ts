// Mock API functions for awards, box office, and movies data

import type { Movie } from "@/components/movies/types" // Assuming Movie type is defined here
import { getApiUrl } from "@/lib/api-config"

// New/Updated Interfaces
export interface MovieFilters {
  page?: number
  limit?: number
  sortBy?: "popularity" | "rating" | "recent" | "year" | "runtime" | "genre_defining"
  subgenre?: string
  yearRange?: [number, number]
  ratingRange?: [number, number]
  countries?: string[]
  languages?: string[]
}

export interface GenreStatisticTopMovie {
  id: string
  title: string
  posterUrl: string
  sidduScore: number
  movieUrl: string
}

export interface GenreStatisticPopularityTrend {
  period: string // e.g., '2020', '2021' or 'Jan', 'Feb'
  score: number
}

export interface GenreStatisticRatingDistribution {
  rating: number // e.g., 1, 2, ..., 10
  count: number
}

export interface GenreStatisticSubgenreBreakdown {
  name: string
  movieCount: number
  percentage: number
}

export interface GenreStatisticFigure {
  id: string
  name: string
  movieCount?: number // Optional, as topDirectors was just string[]
  imageUrl: string
  profileUrl: string
}

export interface GenreStatisticReleaseFrequency {
  year: number
  count: number
}

export interface GenreCuratedCollection {
  id: string
  title: string
  imageUrl: string
  url: string
}

export interface GenreNotableFigure {
  id: string
  name: string
  imageUrl: string
  role: string
  profileUrl: string
}

export interface GenreEvolutionEvent {
  year: number
  movieId: string
  movieTitle: string
  moviePosterUrl: string
  influence: string
  movieUrl: string
}

export interface GenreDetails {
  id: string
  name: string
  description: string
  backgroundImage: string
  subgenres: { id: string; name: string }[]
  statistics: {
    totalMovies: number
    averageRating: number // SidduScore
    topDirectors: string[] // Keep as is or change to GenreStatisticFigure[]
    peakDecade: string
    // New fields
    top3MoviesBySidduScoreInGenre: GenreStatisticTopMovie[]
    availableCountries: string[]
    availableLanguages: string[]
    popularityTrend: GenreStatisticPopularityTrend[]
    ratingDistribution: GenreStatisticRatingDistribution[]
    subgenreBreakdown?: GenreStatisticSubgenreBreakdown[]
    topActorsInGenre: GenreStatisticFigure[]
    releaseFrequencyByYear: GenreStatisticReleaseFrequency[]
  }
  relatedGenres: string[]
  curatedCollections: GenreCuratedCollection[]
  notableFigures: GenreNotableFigure[]
  evolutionTimeline: GenreEvolutionEvent[]
}

// Add new interfaces for Awards
export interface Nominee {
  id: string
  name: string
  type: "movie" | "person" | "song" | "screenplay" // Example types
  imageUrl?: string // Optional: for movie poster or person image
  entityUrl?: string // Optional: URL to movie or person page
  isWinner: boolean
  details?: string // e.g., "for Inception" or character name
}

export interface AwardCategory {
  id: string
  name: string // e.g., "Best Picture", "Best Director"
  nominees: Nominee[]
}

export interface AwardDetails {
  id: string // e.g., "oscars-2023"
  ceremonyName: string // e.g., "The 95th Academy Awards"
  year: number
  date: string // ISO string
  location?: string
  hostedBy?: string[]
  backgroundImageUrl?: string // For the award detail page hero
  logoUrl?: string
  description?: string
  highlights?: string[] // Key moments or notable wins
  categories: AwardCategory[]
  relatedCeremonies?: { id: string; name: string; year: number }[] // For navigation
}

export interface AwardCeremony {
  id: string // e.g., "oscars", "golden-globes"
  name: string // e.g., "Academy Awards", "Golden Globe Awards"
  shortName?: string // e.g., "Oscars"
  description: string
  logoUrl: string
  backgroundImageUrl?: string // For the main awards page or ceremony card
  yearsAvailable: number[] // List of years for which details are available
  nextCeremonyDate?: string // ISO string
  currentYear?: number // The most recent or upcoming year
}

// Mock data for all movies (simplified)
const allMockMovies: Movie[] = [
  // Sci-Fi
  {
    id: "movie1",
    title: "Interstellar",
    year: "2014",
    posterUrl: "/interstellar-poster.png",
    genres: ["Sci-Fi", "Drama"],
    sidduScore: 9.2,
    streamingOptions: {},
    language: "English",
    country: "USA",
    runtime: 169,
    overview: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
  },
  {
    id: "movie2",
    title: "Dune",
    year: "2021",
    posterUrl: "/dune-part-two-poster.png",
    genres: ["Sci-Fi", "Adventure"],
    sidduScore: 8.9,
    streamingOptions: {},
    language: "English",
    country: "USA",
    runtime: 155,
    overview:
      "Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding, must travel to the most dangerous planet in the universe to ensure the future of his family and his people.",
  },
  {
    id: "movie3",
    title: "The Matrix",
    year: "1999",
    posterUrl: "/matrix-poster.png",
    genres: ["Sci-Fi", "Action"],
    sidduScore: 9.0,
    streamingOptions: {},
    language: "English",
    country: "USA",
    runtime: 136,
    overview:
      "A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.",
  },
  {
    id: "movieSF1",
    title: "Blade Runner 2049",
    year: "2017",
    posterUrl: "/blade-runner-2049-poster.png",
    genres: ["Sci-Fi", "Thriller", "Drama"],
    sidduScore: 8.5,
    streamingOptions: {},
    language: "English",
    country: "USA",
    runtime: 163,
    overview:
      "Young Blade Runner K's discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard, who's been missing for thirty years.",
  },
  {
    id: "movieSF2",
    title: "Arrival",
    year: "2016",
    posterUrl: "/arrival-poster.png",
    genres: ["Sci-Fi", "Drama", "Mystery"],
    sidduScore: 8.3,
    streamingOptions: {},
    language: "English",
    country: "Canada",
    runtime: 116,
    overview:
      "A linguist works with the military to communicate with alien lifeforms after twelve mysterious spacecraft appear around the world.",
  },
  {
    id: "movieSF3",
    title: "Ex Machina",
    year: "2014",
    posterUrl: "/placeholder.svg?height=450&width=300",
    genres: ["Sci-Fi", "Drama", "Thriller"],
    sidduScore: 7.9,
    streamingOptions: {},
    language: "English",
    country: "UK",
    runtime: 108,
    overview:
      "A young programmer is selected to participate in a ground-breaking experiment in synthetic intelligence by evaluating the human qualities of a highly advanced humanoid A.I.",
  },
  // Drama
  {
    id: "movie4",
    title: "The Shawshank Redemption",
    year: "1994",
    posterUrl: "/shawshank-redemption-poster.png",
    genres: ["Drama"],
    sidduScore: 9.3,
    streamingOptions: {},
    language: "English",
    country: "USA",
    runtime: 142,
    overview:
      "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
  },
  {
    id: "movie5",
    title: "The Godfather",
    year: "1972",
    posterUrl: "/classic-mob-poster.png",
    genres: ["Drama", "Crime"],
    sidduScore: 9.2,
    streamingOptions: {},
    language: "English",
    country: "USA",
    runtime: 175,
    overview:
      "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
  },
  {
    id: "movie6",
    title: "Parasite",
    year: "2019",
    posterUrl: "/parasite-movie-poster.png",
    genres: ["Drama", "Thriller", "Comedy"],
    sidduScore: 9.0,
    streamingOptions: {},
    language: "Korean",
    country: "South Korea",
    runtime: 132,
    overview:
      "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
  },
  {
    id: "movieD1",
    title: "Forrest Gump",
    year: "1994",
    posterUrl: "/placeholder.svg?height=450&width=300",
    genres: ["Drama", "Romance"],
    sidduScore: 8.8,
    streamingOptions: {},
    language: "English",
    country: "USA",
    runtime: 142,
    overview:
      "The presidencies of Kennedy and Johnson, the Vietnam War, the Watergate scandal and other historical events unfold from the perspective of an Alabama man with an IQ of 75, whose only desire is to be reunited with his childhood sweetheart.",
  },
  {
    id: "movieD2",
    title: "Schindler's List",
    year: "1993",
    posterUrl: "/placeholder.svg?height=450&width=300",
    genres: ["Drama", "History", "Biography"],
    sidduScore: 8.9,
    streamingOptions: {},
    language: "English",
    country: "USA",
    runtime: 195,
    overview:
      "In German-occupied Poland during World War II, industrialist Oskar Schindler gradually becomes concerned for his Jewish workforce after witnessing their persecution by the Nazis.",
  },
  // Add more movies for other genres, languages, countries, years for robust filtering
  {
    id: "movieA1",
    title: "Mad Max: Fury Road",
    year: "2015",
    posterUrl: "/mad-max-fury-road-poster.png",
    genres: ["Action", "Sci-Fi", "Adventure"],
    sidduScore: 8.1,
    streamingOptions: {},
    language: "English",
    country: "Australia",
    runtime: 120,
    overview:
      "In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the help of a group of female prisoners, a psychotic worshiper, and a drifter named Max.",
  },
  {
    id: "movieC1",
    title: "The Grand Budapest Hotel",
    year: "2014",
    posterUrl: "/grand-budapest-hotel-poster.png",
    genres: ["Comedy", "Drama", "Adventure"],
    sidduScore: 8.1,
    streamingOptions: {},
    language: "English",
    country: "Germany",
    runtime: 100,
    overview:
      "The adventures of Gustave H, a legendary concierge at a famous hotel from the fictional Republic of Zubrowka between the first and second World Wars, and Zero Moustafa, the lobby boy who becomes his most trusted friend.",
  },
  {
    id: "movieH1",
    title: "The Conjuring",
    year: "2013",
    posterUrl: "/placeholder.svg?height=450&width=300",
    genres: ["Horror", "Mystery", "Thriller"],
    sidduScore: 7.5,
    streamingOptions: {},
    language: "English",
    country: "USA",
    runtime: 112,
    overview:
      "Paranormal investigators Ed and Lorraine Warren work to help a family terrorized by a dark presence in their farmhouse.",
  },
]

const mockGenreDetailsStore: Record<string, GenreDetails> = {
  "sci-fi": {
    id: "sci-fi",
    name: "Science Fiction",
    description:
      "Science fiction films are defined by a combination of speculative scientific concepts, futuristic technology, and imaginative world-building. Explore vast galaxies, dystopian futures, and the frontiers of human innovation.",
    backgroundImage: "/genre-scifi-hero.png",
    subgenres: [
      { id: "cyberpunk", name: "Cyberpunk" },
      { id: "space-opera", name: "Space Opera" },
      { id: "dystopian", name: "Dystopian" },
      { id: "time-travel", name: "Time Travel" },
    ],
    statistics: {
      totalMovies: 1245,
      averageRating: 8.1, // SidduScore
      topDirectors: ["Christopher Nolan", "Denis Villeneuve", "Ridley Scott"],
      peakDecade: "2010s",
      top3MoviesBySidduScoreInGenre: [
        {
          id: "movie1",
          title: "Interstellar",
          posterUrl: "/interstellar-poster.png",
          sidduScore: 9.2,
          movieUrl: "/movies/movie1",
        },
        {
          id: "movie3",
          title: "The Matrix",
          posterUrl: "/matrix-poster.png",
          sidduScore: 9.0,
          movieUrl: "/movies/movie3",
        },
        {
          id: "movie2",
          title: "Dune",
          posterUrl: "/dune-part-two-poster.png",
          sidduScore: 8.9,
          movieUrl: "/movies/movie2",
        },
      ],
      availableCountries: ["USA", "UK", "Canada", "France", "Australia"],
      availableLanguages: ["English", "French", "Japanese"],
      popularityTrend: [
        { period: "2018", score: 70 },
        { period: "2019", score: 75 },
        { period: "2020", score: 85 },
        { period: "2021", score: 90 },
        { period: "2022", score: 80 },
        { period: "2023", score: 95 },
      ],
      ratingDistribution: [
        { rating: 6, count: 150 },
        { rating: 7, count: 300 },
        { rating: 8, count: 500 },
        { rating: 9, count: 250 },
        { rating: 10, count: 45 },
      ],
      subgenreBreakdown: [
        { name: "Cyberpunk", movieCount: 200, percentage: 16 },
        { name: "Space Opera", movieCount: 350, percentage: 28 },
        { name: "Dystopian", movieCount: 400, percentage: 32 },
        { name: "Time Travel", movieCount: 150, percentage: 12 },
        { name: "Other", movieCount: 145, percentage: 12 },
      ],
      topActorsInGenre: [
        {
          id: "actor1",
          name: "Harrison Ford",
          movieCount: 15,
          imageUrl: "/placeholder.svg?height=50&width=50",
          profileUrl: "/people/actor1",
        },
        {
          id: "actor2",
          name: "Sigourney Weaver",
          movieCount: 12,
          imageUrl: "/placeholder.svg?height=50&width=50",
          profileUrl: "/people/actor2",
        },
        {
          id: "actor3",
          name: "Keanu Reeves",
          movieCount: 10,
          imageUrl: "/placeholder.svg?height=50&width=50",
          profileUrl: "/people/actor3",
        },
      ],
      releaseFrequencyByYear: [
        { year: 2018, count: 50 },
        { year: 2019, count: 55 },
        { year: 2020, count: 45 },
        { year: 2021, count: 60 },
        { year: 2022, count: 52 },
        { year: 2023, count: 65 },
      ],
    },
    relatedGenres: ["fantasy", "action", "thriller", "adventure"],
    curatedCollections: [
      {
        id: "col1",
        title: "Mind-Bending Sci-Fi",
        imageUrl: "/placeholder.svg?height=150&width=250",
        url: "/collections/col1",
      },
      {
        id: "col2",
        title: "Epic Space Journeys",
        imageUrl: "/placeholder.svg?height=150&width=250",
        url: "/collections/col2",
      },
    ],
    notableFigures: [
      {
        id: "fig1",
        name: "Christopher Nolan",
        imageUrl: "/christopher-nolan.png",
        role: "Director",
        profileUrl: "/people/3",
      },
      {
        id: "fig2",
        name: "Denis Villeneuve",
        imageUrl: "/placeholder.svg?height=100&width=100",
        role: "Director",
        profileUrl: "/people/fig2",
      },
      {
        id: "fig3",
        name: "Amy Adams",
        imageUrl: "/placeholder.svg?height=100&width=100",
        role: "Actor",
        profileUrl: "/people/fig3",
      },
    ],
    evolutionTimeline: [
      {
        year: 1927,
        movieId: "metropolis",
        movieTitle: "Metropolis",
        moviePosterUrl: "/placeholder.svg?height=150&width=100",
        influence: "Pioneered visual effects and dystopian themes.",
        movieUrl: "/movies/metropolis",
      },
      {
        year: 1968,
        movieId: "2001",
        movieTitle: "2001: A Space Odyssey",
        moviePosterUrl: "/placeholder.svg?height=150&width=100",
        influence: "Redefined cinematic scale and philosophical depth.",
        movieUrl: "/movies/2001",
      },
      {
        year: 1977,
        movieId: "starwars",
        movieTitle: "Star Wars",
        moviePosterUrl: "/placeholder.svg?height=150&width=100",
        influence: "Popularized the space opera subgenre.",
        movieUrl: "/movies/starwars",
      },
      {
        year: 1982,
        movieId: "bladerunner",
        movieTitle: "Blade Runner",
        moviePosterUrl: "/blade-runner-poster.png",
        influence: "Defined the cyberpunk aesthetic.",
        movieUrl: "/movies/bladerunner",
      },
      {
        year: 1999,
        movieId: "matrix",
        movieTitle: "The Matrix",
        moviePosterUrl: "/matrix-poster.png",
        influence: "Revolutionized action and introduced philosophical concepts to mainstream.",
        movieUrl: "/movies/matrix",
      },
    ],
  },
  drama: {
    id: "drama",
    name: "Drama",
    description:
      "Drama films focus on emotional development of characters facing realistic challenges and conflicts. They delve deep into human relationships, societal issues, and personal journeys, often evoking profound empathy.",
    backgroundImage: "/genre-drama-hero.png",
    subgenres: [
      { id: "crime-drama", name: "Crime Drama" },
      { id: "historical-drama", name: "Historical Drama" },
      { id: "romance-drama", name: "Romance Drama" },
      { id: "legal-drama", name: "Legal Drama" },
    ],
    statistics: {
      totalMovies: 3450,
      averageRating: 8.5,
      topDirectors: ["Martin Scorsese", "Steven Spielberg", "Francis Ford Coppola"],
      peakDecade: "1990s",
      top3MoviesBySidduScoreInGenre: [
        {
          id: "movie4",
          title: "The Shawshank Redemption",
          posterUrl: "/shawshank-redemption-poster.png",
          sidduScore: 9.3,
          movieUrl: "/movies/movie4",
        },
        {
          id: "movie5",
          title: "The Godfather",
          posterUrl: "/classic-mob-poster.png",
          sidduScore: 9.2,
          movieUrl: "/movies/movie5",
        },
        {
          id: "movie6",
          title: "Parasite",
          posterUrl: "/parasite-movie-poster.png",
          sidduScore: 9.0,
          movieUrl: "/movies/movie6",
        },
      ],
      availableCountries: ["USA", "UK", "France", "India", "South Korea", "Germany"],
      availableLanguages: ["English", "French", "Korean", "Hindi", "German"],
      popularityTrend: [
        { period: "2018", score: 80 },
        { period: "2019", score: 88 },
        { period: "2020", score: 75 },
        { period: "2021", score: 82 },
        { period: "2022", score: 90 },
        { period: "2023", score: 85 },
      ],
      ratingDistribution: [
        { rating: 6, count: 200 },
        { rating: 7, count: 800 },
        { rating: 8, count: 1500 },
        { rating: 9, count: 800 },
        { rating: 10, count: 150 },
      ],
      subgenreBreakdown: [
        { name: "Crime Drama", movieCount: 800, percentage: 23 },
        { name: "Historical Drama", movieCount: 600, percentage: 17 },
        { name: "Romance Drama", movieCount: 900, percentage: 26 },
        { name: "Other", movieCount: 1150, percentage: 34 },
      ],
      topActorsInGenre: [
        {
          id: "actorD1",
          name: "Meryl Streep",
          movieCount: 25,
          imageUrl: "/meryl-streep-portrait.png",
          profileUrl: "/people/actorD1",
        },
        {
          id: "actorD2",
          name: "Tom Hanks",
          movieCount: 22,
          imageUrl: "/placeholder.svg?height=50&width=50",
          profileUrl: "/people/actorD2",
        },
        {
          id: "actorD3",
          name: "Leonardo DiCaprio",
          movieCount: 18,
          imageUrl: "/leonardo-dicaprio.png",
          profileUrl: "/people/actorD3",
        },
      ],
      releaseFrequencyByYear: [
        { year: 2018, count: 150 },
        { year: 2019, count: 160 },
        { year: 2020, count: 130 },
        { year: 2021, count: 155 },
        { year: 2022, count: 140 },
        { year: 2023, count: 165 },
      ],
    },
    relatedGenres: ["thriller", "romance", "crime", "biography", "history"],
    curatedCollections: [
      {
        id: "col3",
        title: "Oscar-Winning Dramas",
        imageUrl: "/placeholder.svg?height=150&width=250",
        url: "/collections/col3",
      },
      {
        id: "col4",
        title: "Intense Character Studies",
        imageUrl: "/placeholder.svg?height=150&width=250",
        url: "/collections/col4",
      },
    ],
    notableFigures: [
      {
        id: "figD1",
        name: "Martin Scorsese",
        imageUrl: "/placeholder.svg?height=100&width=100",
        role: "Director",
        profileUrl: "/people/figD1",
      },
      {
        id: "figD2",
        name: "Viola Davis",
        imageUrl: "/viola-davis-portrait.png",
        role: "Actor",
        profileUrl: "/people/figD2",
      },
    ],
    evolutionTimeline: [
      {
        year: 1941,
        movieId: "citizenkane",
        movieTitle: "Citizen Kane",
        moviePosterUrl: "/placeholder.svg?height=150&width=100",
        influence: "Revolutionized narrative structure and cinematography.",
        movieUrl: "/movies/citizenkane",
      },
      {
        year: 1972,
        movieId: "godfather",
        movieTitle: "The Godfather",
        moviePosterUrl: "/classic-mob-poster.png",
        influence: "Set a new standard for crime dramas.",
        movieUrl: "/movies/godfather",
      },
      {
        year: 1994,
        movieId: "shawshank",
        movieTitle: "The Shawshank Redemption",
        moviePosterUrl: "/shawshank-redemption-poster.png",
        influence: "Beloved for its themes of hope and perseverance.",
        movieUrl: "/movies/shawshank",
      },
    ],
  },
  action: {
    id: "action",
    name: "Action",
    description:
      "Action films are characterized by thrilling sequences, stunts, and often involve a hero battling against incredible odds. Expect explosions, car chases, and intense fight scenes.",
    backgroundImage: "/genre-action-hero.png",
    subgenres: [
      { id: "superhero", name: "Superhero" },
      { id: "spy-thriller", name: "Spy Thriller" },
      { id: "martial-arts", name: "Martial Arts" },
    ],
    statistics: {
      totalMovies: 2500,
      averageRating: 7.5,
      topDirectors: ["Michael Bay", "James Cameron", "Chad Stahelski"],
      peakDecade: "2000s",
      top3MoviesBySidduScoreInGenre: [
        {
          id: "dk",
          title: "The Dark Knight",
          posterUrl: "/dark-knight-poster.png",
          sidduScore: 9.0,
          movieUrl: "/movies/dk",
        },
        {
          id: "mi6",
          title: "Mission: Impossible - Fallout",
          posterUrl: "/placeholder.svg?height=450&width=300",
          sidduScore: 8.8,
          movieUrl: "/movies/mi6",
        },
        {
          id: "madmaxfr",
          title: "Mad Max: Fury Road",
          posterUrl: "/mad-max-fury-road-poster.png",
          sidduScore: 8.7,
          movieUrl: "/movies/madmaxfr",
        },
      ],
      availableCountries: ["USA", "Hong Kong", "UK", "China"],
      availableLanguages: ["English", "Cantonese", "Mandarin"],
      popularityTrend: [
        { period: "2023", score: 92 },
        { period: "2022", score: 88 },
        { period: "2021", score: 90 },
      ],
      ratingDistribution: [
        { rating: 7, count: 800 },
        { rating: 8, count: 1000 },
        { rating: 9, count: 400 },
      ],
      topActorsInGenre: [
        {
          id: "tomcruise",
          name: "Tom Cruise",
          movieCount: 20,
          imageUrl: "/placeholder.svg?height=50&width=50",
          profileUrl: "/people/tomcruise",
        },
        {
          id: "keanu",
          name: "Keanu Reeves",
          movieCount: 18,
          imageUrl: "/placeholder.svg?height=50&width=50",
          profileUrl: "/people/keanu",
        },
      ],
      releaseFrequencyByYear: [
        { year: 2023, count: 120 },
        { year: 2022, count: 110 },
        { year: 2021, count: 100 },
      ],
    },
    relatedGenres: ["sci-fi", "thriller", "adventure", "crime"],
    curatedCollections: [
      {
        id: "colAct1",
        title: "Best Fight Choreography",
        imageUrl: "/placeholder.svg?height=150&width=250",
        url: "/collections/colAct1",
      },
    ],
    notableFigures: [
      {
        id: "figAct1",
        name: "Keanu Reeves",
        imageUrl: "/placeholder.svg?height=100&width=100",
        role: "Actor",
        profileUrl: "/people/keanureeves",
      },
    ],
    evolutionTimeline: [
      {
        year: 1988,
        movieId: "diehard",
        movieTitle: "Die Hard",
        moviePosterUrl: "/placeholder.svg?height=150&width=100",
        influence: "Defined the modern action hero.",
        movieUrl: "/movies/diehard",
      },
    ],
  },
  comedy: {
    id: "comedy",
    name: "Comedy",
    description:
      "Comedy films aim to entertain and amuse audiences through humor. Styles range from slapstick and satire to romantic comedies and dark humor.",
    backgroundImage: "/genre-comedy-hero.png",
    subgenres: [
      { id: "rom-com", name: "Romantic Comedy" },
      { id: "slapstick", name: "Slapstick" },
      { id: "satire", name: "Satire" },
    ],
    statistics: {
      totalMovies: 3200,
      averageRating: 7.2,
      topDirectors: ["Judd Apatow", "Taika Waititi", "Edgar Wright"],
      peakDecade: "1990s",
      top3MoviesBySidduScoreInGenre: [
        {
          id: "movieC1",
          title: "The Grand Budapest Hotel",
          posterUrl: "/grand-budapest-hotel-poster.png",
          sidduScore: 8.1,
          movieUrl: "/movies/movieC1",
        },
        {
          id: "paddington2",
          title: "Paddington 2",
          posterUrl: "/paddington-poster.png",
          sidduScore: 8.0,
          movieUrl: "/movies/paddington2",
        },
        {
          id: "superbad",
          title: "Superbad",
          posterUrl: "/placeholder.svg?height=450&width=300",
          sidduScore: 7.9,
          movieUrl: "/movies/superbad",
        },
      ],
      availableCountries: ["USA", "UK", "France", "Canada"],
      availableLanguages: ["English", "French"],
      popularityTrend: [{ period: "2023", score: 85 }],
      ratingDistribution: [{ rating: 7, count: 1200 }],
      topActorsInGenre: [
        {
          id: "jimcarrey",
          name: "Jim Carrey",
          movieCount: 28,
          imageUrl: "/placeholder.svg?height=50&width=50",
          profileUrl: "/people/jimcarrey",
        },
      ],
      releaseFrequencyByYear: [{ year: 2023, count: 150 }],
    },
    relatedGenres: ["romance", "family", "animation"],
    curatedCollections: [
      {
        id: "colCom1",
        title: "Laugh Out Loud",
        imageUrl: "/placeholder.svg?height=150&width=250",
        url: "/collections/colCom1",
      },
    ],
    notableFigures: [
      {
        id: "figCom1",
        name: "Melissa McCarthy",
        imageUrl: "/placeholder.svg?height=100&width=100",
        role: "Actor",
        profileUrl: "/people/melissamccarthy",
      },
    ],
    evolutionTimeline: [
      {
        year: 1959,
        movieId: "somehot",
        movieTitle: "Some Like It Hot",
        moviePosterUrl: "/placeholder.svg?height=150&width=100",
        influence: "Classic screwball comedy.",
        movieUrl: "/movies/somehot",
      },
    ],
  },
  horror: {
    id: "horror",
    name: "Horror",
    description:
      "Horror films are designed to elicit fear, suspense, and terror. They often explore dark themes, supernatural elements, and psychological thrills.",
    backgroundImage: "/genre-horror-hero.png",
    subgenres: [
      { id: "slasher", name: "Slasher" },
      { id: "supernatural", name: "Supernatural" },
      { id: "psychological", name: "Psychological Horror" },
    ],
    statistics: {
      totalMovies: 1800,
      averageRating: 6.8,
      topDirectors: ["James Wan", "Jordan Peele", "Ari Aster"],
      peakDecade: "2010s",
      top3MoviesBySidduScoreInGenre: [
        {
          id: "hereditary",
          title: "Hereditary",
          posterUrl: "/placeholder.svg?height=450&width=300",
          sidduScore: 7.8,
          movieUrl: "/movies/hereditary",
        },
        {
          id: "getout",
          title: "Get Out",
          posterUrl: "/placeholder.svg?height=450&width=300",
          sidduScore: 7.7,
          movieUrl: "/movies/getout",
        },
        {
          id: "movieH1",
          title: "The Conjuring",
          posterUrl: "/placeholder.svg?height=450&width=300",
          sidduScore: 7.5,
          movieUrl: "/movies/movieH1",
        },
      ],
      availableCountries: ["USA", "UK", "Japan", "Spain"],
      availableLanguages: ["English", "Japanese", "Spanish"],
      popularityTrend: [{ period: "2023", score: 88 }],
      ratingDistribution: [{ rating: 7, count: 600 }],
      topActorsInGenre: [
        {
          id: "tonicollette",
          name: "Toni Collette",
          movieCount: 10,
          imageUrl: "/placeholder.svg?height=50&width=50",
          profileUrl: "/people/tonicollette",
        },
      ],
      releaseFrequencyByYear: [{ year: 2023, count: 90 }],
    },
    relatedGenres: ["thriller", "mystery", "sci-fi"],
    curatedCollections: [
      {
        id: "colHor1",
        title: "Modern Horror Classics",
        imageUrl: "/placeholder.svg?height=150&width=250",
        url: "/collections/colHor1",
      },
    ],
    notableFigures: [
      {
        id: "figHor1",
        name: "James Wan",
        imageUrl: "/placeholder.svg?height=100&width=100",
        role: "Director",
        profileUrl: "/people/jameswan",
      },
    ],
    evolutionTimeline: [
      {
        year: 1960,
        movieId: "psycho",
        movieTitle: "Psycho",
        moviePosterUrl: "/placeholder.svg?height=150&width=100",
        influence: "Pioneered psychological horror.",
        movieUrl: "/movies/psycho",
      },
    ],
  },
}

// Mock data for Awards
const mockAwardCeremonies: AwardCeremony[] = [
  {
    id: "oscars",
    name: "Academy Awards",
    shortName: "Oscars",
    description:
      "The most prestigious awards in filmmaking, presented by the Academy of Motion Picture Arts and Sciences.",
    logoUrl: "/oscar-trophy.png",
    backgroundImageUrl: "/oscar-ceremony-stage.png",
    yearsAvailable: [2024, 2023, 2022, 2021, 2020],
    currentYear: 2024,
    nextCeremonyDate: "2026-03-10T00:00:00Z",
  },
  {
    id: "golden-globes",
    name: "Golden Globe Awards",
    shortName: "Golden Globes",
    description:
      "Honoring excellence in both film and television, presented by the Hollywood Foreign Press Association.",
    logoUrl: "/placeholder-8bjil.png",
    backgroundImageUrl: "/golden-globes-stage.png",
    yearsAvailable: [2024, 2023, 2022],
    currentYear: 2024,
  },
  {
    id: "baftas",
    name: "British Academy Film Awards",
    shortName: "BAFTAs",
    description:
      "Presented by the British Academy of Film and Television Arts, celebrating excellence in cinematic and television arts.",
    logoUrl: "/bafta-mask-trophy.png",
    backgroundImageUrl: "/bafta-ceremony.png",
    yearsAvailable: [2024, 2023],
    currentYear: 2024,
  },
]

const mockAwardDetailsStore: Record<string, AwardDetails> = {
  "oscars-2024": {
    id: "oscars-2024",
    ceremonyName: "The 96th Academy Awards",
    year: 2024,
    date: "2024-03-10T00:00:00Z",
    location: "Dolby Theatre, Hollywood, Los Angeles",
    hostedBy: ["Jimmy Kimmel"],
    backgroundImageUrl: "/oscar-ceremony-stage.png",
    logoUrl: "/oscar-trophy.png",
    description: "Celebrating the best films of 2023.",
    highlights: [
      "Oppenheimer wins 7 awards including Best Picture.",
      "Poor Things takes home 4 awards.",
      "Emotional acceptance speeches.",
    ],
    categories: [
      {
        id: "best-picture",
        name: "Best Picture",
        nominees: [
          {
            id: "oppenheimer",
            name: "Oppenheimer",
            type: "movie",
            entityUrl: "/movies/oppenheimer",
            imageUrl: "/oppenheimer-inspired-poster.png",
            isWinner: true,
          },
          {
            id: "poor-things",
            name: "Poor Things",
            type: "movie",
            entityUrl: "/movies/poor-things",
            imageUrl: "/poor-things-poster.png",
            isWinner: false,
          },
          {
            id: "killers-flower-moon",
            name: "Killers of the Flower Moon",
            type: "movie",
            entityUrl: "/movies/killers-flower-moon",
            imageUrl: "/killers-of-the-flower-moon-poster.png",
            isWinner: false,
          },
          {
            id: "barbie",
            name: "Barbie",
            type: "movie",
            entityUrl: "/movies/barbie",
            imageUrl: "/barbie-movie-poster.png",
            isWinner: false,
          },
        ],
      },
      {
        id: "best-director",
        name: "Best Director",
        nominees: [
          {
            id: "nolan",
            name: "Christopher Nolan",
            type: "person",
            entityUrl: "/people/3",
            imageUrl: "/christopher-nolan.png",
            details: "for Oppenheimer",
            isWinner: true,
          },
          {
            id: "scorsese",
            name: "Martin Scorsese",
            type: "person",
            entityUrl: "/people/scorsese",
            imageUrl: "/portrait-of-a-film-director.png",
            details: "for Killers of the Flower Moon",
            isWinner: false,
          },
          {
            id: "lanthimos",
            name: "Yorgos Lanthimos",
            type: "person",
            entityUrl: "/people/lanthimos",
            imageUrl: "/placeholder.svg?height=100&width=100",
            details: "for Poor Things",
            isWinner: false,
          },
        ],
      },
      {
        id: "best-actor",
        name: "Best Actor",
        nominees: [
          {
            id: "murphy",
            name: "Cillian Murphy",
            type: "person",
            entityUrl: "/people/murphy",
            imageUrl: "/cillian-murphy-portrait.png",
            details: "for Oppenheimer",
            isWinner: true,
          },
          {
            id: "giamatti",
            name: "Paul Giamatti",
            type: "person",
            entityUrl: "/people/giamatti",
            imageUrl: "/placeholder.svg?height=100&width=100",
            details: "for The Holdovers",
            isWinner: false,
          },
        ],
      },
      {
        id: "best-actress",
        name: "Best Actress",
        nominees: [
          {
            id: "stone",
            name: "Emma Stone",
            type: "person",
            entityUrl: "/people/stone",
            imageUrl: "/placeholder.svg?height=100&width=100",
            details: "for Poor Things",
            isWinner: true,
          },
          {
            id: "gladstone",
            name: "Lily Gladstone",
            type: "person",
            entityUrl: "/people/gladstone",
            imageUrl: "/placeholder.svg?height=100&width=100",
            details: "for Killers of the Flower Moon",
            isWinner: false,
          },
        ],
      },
    ],
    relatedCeremonies: [
      { id: "oscars-2023", name: "95th Academy Awards", year: 2023 },
      { id: "oscars-2022", name: "94th Academy Awards", year: 2022 },
    ],
  },
  "oscars-2023": {
    id: "oscars-2023",
    ceremonyName: "The 95th Academy Awards",
    year: 2023,
    date: "2023-03-12T00:00:00Z",
    location: "Dolby Theatre, Hollywood, Los Angeles",
    hostedBy: ["Jimmy Kimmel"],
    backgroundImageUrl: "/oscar-ceremony-stage.png",
    logoUrl: "/oscar-trophy.png",
    description: "Celebrating the best films of 2022.",
    categories: [
      {
        id: "best-picture",
        name: "Best Picture",
        nominees: [
          {
            id: "eeaa",
            name: "Everything Everywhere All at Once",
            type: "movie",
            entityUrl: "/movies/eeaa",
            imageUrl: "/everything-everywhere-poster.png",
            isWinner: true,
          },
          {
            id: "banshees",
            name: "The Banshees of Inisherin",
            type: "movie",
            entityUrl: "/movies/banshees",
            imageUrl: "/banshees-poster.png",
            isWinner: false,
          },
        ],
      },
    ],
    relatedCeremonies: [
      { id: "oscars-2024", name: "96th Academy Awards", year: 2024 },
      { id: "oscars-2022", name: "94th Academy Awards", year: 2022 },
    ],
  },
  // Add more details for other ceremonies and years as needed
}

export async function getGenreDetails(genreId: string): Promise<GenreDetails | null> {
  const apiBase = getApiUrl()
  const useBackend = process.env.NEXT_PUBLIC_ENABLE_BACKEND === "true" && !!apiBase
  if (useBackend) {
    try {
      const res = await fetch(`${apiBase}/api/v1/genres/${encodeURIComponent(genreId)}`, { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        return data as GenreDetails
      }
    } catch {
      // fallback to mock below
    }
  }
  await new Promise((resolve) => setTimeout(resolve, 300)) // Simulate API delay
  const details = mockGenreDetailsStore[genreId.toLowerCase()]
  if (details) {
    return JSON.parse(JSON.stringify(details)) // Deep copy to prevent mutation
  }
  return null
}

export async function getMoviesByGenre(
  genreId: string,
  filters: MovieFilters = { page: 1, limit: 20 },
): Promise<Movie[]> {
  const apiBase = getApiUrl()
  const useBackend = process.env.NEXT_PUBLIC_ENABLE_BACKEND === "true" && !!apiBase
  if (useBackend) {
    try {
      const params = new URLSearchParams()
      const { page, limit, sortBy, subgenre, yearRange, ratingRange, countries, languages } = filters || {}
      if (page) params.set("page", String(page))
      if (limit) params.set("limit", String(limit))
      if (sortBy) params.set("sortBy", sortBy)
      if (subgenre && subgenre !== "all") params.set("subgenre", subgenre)
      if (yearRange) {
        params.set("yearMin", String(yearRange[0]))
        params.set("yearMax", String(yearRange[1]))
      }
      if (ratingRange) {
        params.set("ratingMin", String(ratingRange[0]))
        params.set("ratingMax", String(ratingRange[1]))
      }
      if (countries?.length) params.set("countries", countries.join(","))
      if (languages?.length) params.set("languages", languages.join(","))
      const res = await fetch(`${apiBase}/api/v1/genres/${encodeURIComponent(genreId)}/movies?${params.toString()}`, {
        cache: "no-store",
      })
      if (res.ok) {
        const data = await res.json()
        return data as Movie[]
      }
    } catch {
      // fallback to mock below
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 400)) // Simulate API delay
  const {
    page = 1,
    limit = 20,
    sortBy = "popularity",
    subgenre,
    yearRange,
    ratingRange,
    countries,
    languages,
  } = filters

  let Gmovies = allMockMovies.filter((movie) =>
    movie.genres?.map((g) => g.toLowerCase()).includes(genreId.toLowerCase()),
  )

  if (subgenre && subgenre !== "all" && mockGenreDetailsStore[genreId.toLowerCase()]) {
    const subgenreName = mockGenreDetailsStore[genreId.toLowerCase()].subgenres.find((s) => s.id === subgenre)?.name
    if (subgenreName) {
      Gmovies = Gmovies.filter((movie) => movie.genres?.includes(subgenreName))
    }
  }

  if (yearRange) {
    Gmovies = Gmovies.filter((movie) => {
      const movieYear = Number.parseInt(movie.year || "0")
      return movieYear >= yearRange[0] && movieYear <= yearRange[1]
    })
  }

  if (ratingRange) {
    Gmovies = Gmovies.filter(
      (movie) => movie.sidduScore && movie.sidduScore >= ratingRange[0] && movie.sidduScore <= ratingRange[1],
    )
  }

  if (countries && countries.length > 0) {
    Gmovies = Gmovies.filter((movie) => movie.country && countries.includes(movie.country))
  }

  if (languages && languages.length > 0) {
    Gmovies = Gmovies.filter((movie) => movie.language && languages.includes(movie.language))
  }

  // Sorting
  Gmovies.sort((a, b) => {
    const aScore = a.sidduScore || 0
    const bScore = b.sidduScore || 0
    const aYear = Number.parseInt(a.year || "0")
    const bYear = Number.parseInt(b.year || "0")
    const aRuntime = a.runtime || 0
    const bRuntime = b.runtime || 0

    switch (sortBy) {
      case "rating":
        return bScore - aScore
      case "recent":
      case "year":
        return bYear - aYear
      case "runtime":
        return bRuntime - aRuntime
      case "genre_defining":
        // Mock: assume higher score is more genre defining for now
        return bScore - aScore
      case "popularity":
      default:
        return bScore - aScore
    }
  })

  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit

  return JSON.parse(JSON.stringify(Gmovies.slice(startIndex, endIndex)))
}

// Add the new functions
export async function getAwardsCeremonies(): Promise<AwardCeremony[]> {
  await new Promise((resolve) => setTimeout(resolve, 200)) // Simulate API delay
  return JSON.parse(JSON.stringify(mockAwardCeremonies)) // Deep copy
}

export async function getAwardDetails(ceremonyIdWithYear: string): Promise<AwardDetails | null> {
  await new Promise((resolve) => setTimeout(resolve, 350)) // Simulate API delay
  const details = mockAwardDetailsStore[ceremonyIdWithYear.toLowerCase()]
  if (details) {
    return JSON.parse(JSON.stringify(details)) // Deep copy
  }
  return null
}

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const pulseApi = {
  getPulseFeed: async (params: {
    filter?: "latest" | "popular" | "following" | "trending"
    window?: "24h" | "7d" | "30d"
    page?: number
    limit?: number
    hashtag?: string
    linkedType?: string
  }) => {
    const query = new URLSearchParams({
      filter: params.filter || "latest",
      window: params.window || "7d",
      page: (params.page || 1).toString(),
      limit: (params.limit || 20).toString(),
    })
    if (params.hashtag) query.append("hashtag", params.hashtag)
    if (params.linkedType) query.append("linkedType", params.linkedType)

    const response = await fetch(`${getApiUrl()}/api/v1/pulse/feed?${query.toString()}`, {
      method: "GET",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      credentials: "include",
      mode: "cors",
    })
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch feed: ${response.status} - ${errorText}`)
    }
    return response.json()
  },

  getTrendingTopics: async (window: "24h" | "7d" | "30d" = "7d", limit = 10) => {
    const query = new URLSearchParams({
      window,
      limit: limit.toString(),
    })
    const response = await fetch(`${getApiUrl()}/api/v1/pulse/trending-topics?${query.toString()}`, {
      method: "GET",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      credentials: "include",
      mode: "cors",
    })
    if (!response.ok) throw new Error("Failed to fetch trending topics")
    return response.json()
  },

  createPulse: async (data: {
    contentText: string
    contentMedia?: string[]
    linkedMovieId?: string
    hashtags?: string[]
    postedAsRole?: string
    starRating?: number
  }) => {
    const response = await fetch(`${getApiUrl()}/api/v1/pulse`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      credentials: "include",
      mode: "cors",
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error("Failed to create pulse")
    return response.json()
  },

  deletePulse: async (id: string) => {
    const response = await fetch(`${getApiUrl()}/api/v1/pulse/${id}`, {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      credentials: "include",
      mode: "cors",
    })
    if (!response.ok) throw new Error("Failed to delete pulse")
    return response.json()
  },

  toggleReaction: async (id: string, type: string) => {
    const response = await fetch(`${getApiUrl()}/api/v1/pulse/${id}/reactions`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      credentials: "include",
      mode: "cors",
      body: JSON.stringify({ type }),
    })
    if (!response.ok) throw new Error("Failed to toggle reaction")
    return response.json()
  },

  addComment: async (id: string, content: string) => {
    const response = await fetch(`${getApiUrl()}/api/v1/pulse/${id}/comments`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      credentials: "include",
      mode: "cors",
      body: JSON.stringify({ content }),
    })
    if (!response.ok) throw new Error("Failed to add comment")
    return response.json()
  },

  getComments: async (id: string, page = 1, limit = 20) => {
    const response = await fetch(
      `${getApiUrl()}/api/v1/pulse/${id}/comments?page=${page}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        credentials: "include",
        mode: "cors",
      }
    )
    if (!response.ok) throw new Error("Failed to get comments")
    return response.json()
  },

  bookmarkPulse: async (id: string) => {
    const response = await fetch(`${getApiUrl()}/api/v1/pulse/${id}/bookmark`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      credentials: "include",
      mode: "cors",
    })
    if (!response.ok) throw new Error("Failed to bookmark pulse")
    return response.json()
  },

  unbookmarkPulse: async (id: string) => {
    const response = await fetch(`${getApiUrl()}/api/v1/pulse/${id}/bookmark`, {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      credentials: "include",
      mode: "cors",
    })
    if (!response.ok) throw new Error("Failed to unbookmark pulse")
    return response.json()
  },

  sharePulse: async (id: string) => {
    const response = await fetch(`${getApiUrl()}/api/v1/pulse/${id}/share`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      credentials: "include",
      mode: "cors",
    })
    if (!response.ok) throw new Error("Failed to share pulse")
    return response.json()
  },

  followUser: async (username: string) => {
    const response = await fetch(`${getApiUrl()}/api/v1/users/${username}/follow`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      credentials: "include",
      mode: "cors",
    })
    if (!response.ok) throw new Error("Failed to follow user")
    return response.json()
  },

  unfollowUser: async (username: string) => {
    const response = await fetch(`${getApiUrl()}/api/v1/users/${username}/follow`, {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      credentials: "include",
      mode: "cors",
    })
    if (!response.ok) throw new Error("Failed to unfollow user")
    return response.json()
  },

  getSuggestedUsers: async (limit = 5) => {
    const response = await fetch(`${getApiUrl()}/api/v1/users/suggested?limit=${limit}`, {
      method: "GET",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      credentials: "include",
      mode: "cors",
    })
    if (!response.ok) throw new Error("Failed to fetch suggested users")
    return response.json()
  },

  uploadMedia: async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    const headers = getAuthHeaders()
    if (!headers.Authorization) {
      throw new Error("Authentication required for upload")
    }

    const response = await fetch(`${getApiUrl()}/api/v1/upload/media`, {
      method: "POST",
      headers: {
        Authorization: headers.Authorization,
      },
      credentials: "include",
      mode: "cors",
      body: formData,
    })
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to upload media: ${response.status} - ${errorText}`)
    }
    return response.json()
  },
}

