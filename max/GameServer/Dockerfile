﻿FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["GameServer.Api/GameServer.Api.csproj", "GameServer.Api/"]
COPY ["GameServer.Api.Contracts/GameServer.Api.Contracts.csproj", "GameServer.Api.Contracts/"]
COPY ["GameServer.Data/GameServer.Data.csproj", "GameServer.Data/"]
COPY ["GameServer.Domain/GameServer.Domain.csproj", "GameServer.Domain/"]
RUN dotnet restore "GameServer.Api/GameServer.Api.csproj"
COPY . .
WORKDIR "/src/GameServer.Api"
RUN dotnet build "GameServer.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "GameServer.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
COPY ["GameServer.Api/wwwroot", "/app/wwwroot"]
ENTRYPOINT ["dotnet", "GameServer.Api.dll"]
