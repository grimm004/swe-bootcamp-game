using GameServer.Api.Endpoints.AdminEndpoints;
using GameServer.Api.Endpoints.UserEndpoints;
using GameServer.Api.Extensions;
using GameServer.Api.Services;
using GameServer.Data;
using GameServer.Domain;
using GameServer.Domain.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

const string dbPath = "game-server.db";

builder.Services
    .AddEndpointsApiExplorer()
    .AddSwaggerGen()
    .AddGameServerData(dbContextOptions =>
        dbContextOptions
            .UseSqlite($"Data Source={dbPath}")
            .EnableSensitiveDataLogging())
    .AddSingleton<ISaltedHashService, Sha512SaltedHashService>(_ =>
        new Sha512SaltedHashService("GameUserPasswordSalt"u8.ToArray()))
    .AddDomain();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    await using var serviceScope = app.Services.CreateAsyncScope();
    await using var dbContext = serviceScope.ServiceProvider.GetRequiredService<GameServerDbContext>();
    await dbContext.Database.EnsureCreatedAsync();
}

app.UseHttpsRedirection();
app.UseGameClientFileServer();

app.MapGroup("/api/v1")
    .MapAuthEndpoints()
    .MapAdminAuthEndpoints();

app.Run();