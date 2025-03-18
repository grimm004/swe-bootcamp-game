using System.Diagnostics.CodeAnalysis;
using GameServer.Api.Auth;
using GameServer.Api.Constants;
using GameServer.Api.Endpoints;
using GameServer.Api.Extensions;
using GameServer.Api.Hubs;
using GameServer.Api.Services;
using GameServer.Data;
using GameServer.Domain;
using GameServer.Domain.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;

const string defaultConnectionString = "Data Source=game-server.db";

var dbProvider = Environment.GetEnvironmentVariable("GameServerDbProvider")?.ToUpperInvariant() switch
{
    "SQLITE" => DbProvider.Sqlite,
    "SQLSERVER" => DbProvider.SqlServer,
    null => DbProvider.Sqlite,
    _ => (DbProvider?)null
};

var connectionString = Environment.GetEnvironmentVariable("GameServerDbConnectionString") ?? defaultConnectionString;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddEndpointsApiExplorer()
    .AddSwaggerGen()
    .AddGameServerData(dbContextOptions =>
        (dbProvider switch
        {
            DbProvider.Sqlite => dbContextOptions.UseSqlite(connectionString),
            DbProvider.SqlServer => dbContextOptions.UseSqlServer(connectionString),
            _ => throw new Exception("Invalid or unsupported database provider specified.")
        }).EnableSensitiveDataLogging())
    .AddSingleton<ISaltedHashService, Sha512SaltedHashService>(_ =>
        new Sha512SaltedHashService("GameUserPasswordSalt"u8.ToArray()))
    .AddDomain();

builder.Services.AddSignalR();

builder.Services.AddAuthentication("GameServerScheme")
    .AddScheme<AuthenticationSchemeOptions, SessionAuthenticationHandler>(
        "GameServerScheme", _ => { });

builder.Services.AddAuthorizationBuilder()
    .AddPolicy(AuthPolicies.AllAuthenticated, policy => policy
        .RequireAuthenticatedUser())
    .AddPolicy(AuthPolicies.Player, policy => policy
        .RequireAuthenticatedUser()
        .RequireRole(AuthRoles.Admin, AuthRoles.Player))
    .AddPolicy(AuthPolicies.AdminOnly, policy => policy
        .RequireAuthenticatedUser()
        .RequireRole(AuthRoles.Admin));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    await app.Services.EnsureDatabaseCreatedAsync();
}

app.UseHttpsRedirection();
app.UseGameClientFileServer();

app.UseAuthentication();
app.UseAuthorization();

app.MapGroup("/api/v1")
    .MapAuthEndpoints()
    .MapAdminAuthEndpoints()
    .MapLobbyEndpoints();

app.MapHub<LobbyHub>("/hubs/v1/lobby");
app.MapHub<GameHub>("/hubs/v1/game");

app.Run();

[ExcludeFromCodeCoverage]
public static partial class Program;

internal enum DbProvider
{
    Sqlite,
    SqlServer
}