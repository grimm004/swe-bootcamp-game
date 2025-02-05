using System.Text;
using GameServer.Api.Contracts.Requests;
using GameServer.Api.Extensions;
using GameServer.Api.Services;
using GameServer.Data;
using GameServer.Data.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

const string dbPath = "game-server.db";

builder.Services
    .AddEndpointsApiExplorer()
    .AddSwaggerGen()
    .AddGameServerData(dbContextOptions =>
        dbContextOptions.UseSqlite($"Data Source={dbPath}"))
    .AddSingleton<IHashService, SaltedSha512HashService>(_ =>
        new SaltedSha512HashService("GameUserPasswordSalt"u8.ToArray()));

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
app.UseGameFileServer();

var apiRoute = app.MapGroup("/api/v1");

var usersRoute = apiRoute.MapGroup("/users");

usersRoute.MapPost("",
        async (CreateUserRequest request, GameServerDbContext dbContext, IHashService hashService,
            CancellationToken token) =>
        {
            var user = new User
            {
                Email = request.Email,
                PasswordHash = hashService.HashData(Encoding.UTF8.GetBytes(request.Password)),
                Username = request.Username,
                DisplayName = request.DisplayName
            };

            await dbContext.Users.AddAsync(user, token);
            await dbContext.SaveChangesAsync(token);

            return user;
        })
    .WithName("CreateUser")
    .WithOpenApi();

usersRoute.MapGet("", async (GameServerDbContext dbContext, CancellationToken token) =>
    {
        var users = await dbContext.Users.ToListAsync(token);
        return users;
    })
    .WithName("GetUsers")
    .WithOpenApi();

usersRoute.MapGet("/{id:guid}", async (Guid id, GameServerDbContext dbContext, CancellationToken token) =>
    {
        var user = await dbContext.Users.FindAsync([id], token);
        return user is null ? Results.NotFound() : Results.Ok(user);
    })
    .WithName("GetUserById")
    .WithOpenApi();

usersRoute.MapPut("/{id:guid}",
        async ([FromRoute] Guid id, [FromBody] UpdateUserRequest request, GameServerDbContext dbContext,
            CancellationToken token) =>
        {
            var user = await dbContext.Users.FindAsync([id], token);

            if (user is null)
                return Results.NotFound();

            user.Email = request.Email;
            user.Username = request.Username;
            user.DisplayName = request.DisplayName;

            await dbContext.SaveChangesAsync(token);

            return Results.Ok(user);
        })
    .WithName("UpdateUser")
    .WithOpenApi();

usersRoute.MapDelete("/{id:guid}", async (Guid id, GameServerDbContext dbContext, CancellationToken token) =>
    {
        var user = await dbContext.Users.FindAsync([id], token);

        if (user is null)
            return Results.NotFound();

        dbContext.Users.Remove(user);
        await dbContext.SaveChangesAsync(token);

        return Results.NoContent();
    })
    .WithName("DeleteUserById")
    .WithOpenApi();

app.Run();