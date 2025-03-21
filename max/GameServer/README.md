# BP SWE Bootcamp Server Project

The server-side of the project consists of an ASP.NET Core 8.0 Web API project, which is capable of serving the static
front-end as well as providing a RESTful API for UI auth and UI state transfer and SignalR hubs for real-time
multiplayer communication.

## Features

- RESTful API for user authentication and lobby management
- SignalR hubs for real-time lobby information and multiplayer communication
- Entity Framework Core for database access, with support for SQLite (default) and SQL Server
- Cookie or bearer token-based authentication
- Session-based authentication and role-based authorization
- Swagger UI for API documentation
- Modular project structure for separation of concerns
- Unit tests for the majority of services and mappers using NUnit, Moq, and FluentAssertions
- Dockerfile for containerization
- Server-side model of the game state
- Background service for emitting fixed-time-step state updates
- Multi-tenant architecture for multiple users, lobbies, and games
- Support for near-unlimited concurrent users (subject to client and server resources, impacted by latency)

## Setup

The server project is set up to use SQLite by default, but can be configured to use SQL Server using the environment
variables defined in `GameServer.Api/Program.cs`.
Configuration can otherwise be done in `appsettings.json` or `appsettings.Development.json`, and using
`launchSettings.json` for run profiles.

By default, on build, the static resources from the GameClient project are copied to the `wwwroot` folder in the
`GameServer.Api` project.
This results in the static content being served from the same domain as the API.

From the solution root, the usual dotnet commands can be used to build, run, and test the solution.
The entrypoint project is `GameServer.Api`.

```
dotnet build
dotnet test
dotnet run --project GameServer.Api
```

Or optionally for specific launch profile:

```
dotnet run --project GameServer.Api --launch-profile https
```

## Usage

Once running, use the URI displayed in the console to access the web application.
The Swagger UI can be accessed through the `/swagger` path for API documentation.

## Solution Structure

```
/GameServer.Api/: ASP.NET Core 8.0 Web API project
/GameServer.Api.Contracts/: Shared contracts for API and SignalR communication
/GameServer.Api.Data/: Data access layer, implementes Domain-layer repositories, hiding underling EF Core implementation
/GameServer.Api.Domain/: Domain layer, containing business logic and domain model
[/Tests]/GameServer.Api.Tests.Unit/: Unit tests for the mappers and services
/Dockerfile: Dockerfile for containerization (may require a project build to copy static files before running)
```

Within the `GameServer.Api` project, the main highlights are:
- `/Auth/SessionAuthenticationHandler.cs`: Custom authentication handler for session-based cookie/bearer token
  authentication
- `/BackgroundServices/GameBackgroundService.cs`: Background service for emitting fixed-time-step state updates
- `/Endpoints/`: Minimal API definitions and handlers for user authentication and lobby management
- `/Hubs/`: SignalR hubs for real-time lobby information and multiplayer communication
- `/Program.cs`: Entry point for the application, registers services and middleware

Within the `GameServer.Api.Domain` project, the main highlights are:
- `/GameModels/`: Game state models
- `/Models/`: Auth, user, and lobby domain models
- `/Repositories/`: Interfaces for domain-level data access repositories
- `/Services/`: Interfaces and implementations for auth, user, lobby, and in-memory game state services
- `/DependencyInjectionModule.cs`: Dependency injection module for registering domain level services

Within the `GameServer.Api.Data` project, the main highlights are:
- `/Entities/`: EF Core entities for persisted data, including user, user credentials, auth sessions, and lobbies
- `/EntityDbMappers/`: Mappers for setting up EF Core Entities within the DbContext
- `/Repositories/`: Implementations of domain-level repositories, hiding EF Core implementation
- `/GameServerDbContext.cs`: EF Core DbContext for the application
