# NestJS AI EduMiner

**NestJS AI EduMiner** is a web scraping and AI-assisted service that collects educational content from sources like Khan Academy, PBS LearningMedia, and CK-12. It allows querying by keyword and grade level, with optional OpenAI-based scoring. The system is modular, secure, and includes caching, DTO-based validation, and service health monitoring.

## Features

- Scrapes content from:
  - Khan Academy
  - PBS LearningMedia
  - CK-12
- Grade normalization per source
- Optional OpenAI-based relevance scoring
- HTTP caching to reduce redundant scraping
- Uses DTOs to validate and transform incoming requests
- Guards and custom decorators for route protection
- `/ping` endpoint to check service health

## Tech Stack

- **NestJS**
- **Puppeteer**
- **OpenAI API**
- **Redis** for caching
- **class-validator**, Guards, and Decorators

## Getting Started

### Prerequisites

- OpenAI API key
- Redis

---

## API Endpoints

### GET `/scrape`

Search and scrape educational content from the supported sources.

#### Query Parameters:

| Name                | Type     | Description                                               |
|---------------------|----------|-----------------------------------------------------------|
| `q`                 | string   | Search keyword                                            |
| `grade`             | string   | Grade level (`K`, `1`, `2`, ..., `12`, or `all`)          |
| `page`              | number   | Pagination page number                                    |
| `allowAIProcessing` | boolean | Whether to apply OpenAI-based relevance scoring            |

#### Example Request

```
GET http://localhost:3000/scrape?q=algebra&grade=8&page=1&allowAIProcessing=true
```

#### Example Response

```json
[
  {
    "title": "Algebra Basics",
    "description": "Introductory video on algebra.",
    "link": "https://www.khanacademy.org/math/algebra",
    "image": "https://cdn.kastatic.org/image.jpg",
    "grade": "8",
    "type": "video",
    "source": "KhanAcademy"
  }
]
```

---

### GET `/ping`

Health check endpoint to verify service availability.

#### Example Request

```
GET http://localhost:3000/ping
```

#### Example Response

```json
{
  "message": "The server is up and running!"
}
```
