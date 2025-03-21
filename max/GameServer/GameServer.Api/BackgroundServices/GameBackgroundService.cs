using System.Diagnostics.CodeAnalysis;
using GameServer.Api.Hubs;
using GameServer.Api.Mappers;
using GameServer.Domain.Services;
using Microsoft.AspNetCore.SignalR;

namespace GameServer.Api.BackgroundServices;

[ExcludeFromCodeCoverage]
internal class GameBackgroundService(
    IGameService gameService, IHubContext<GameHub, IGameClient> gameHub, ILogger<GameBackgroundService> logger) : BackgroundService
{
    private const double TickRate = 64.0; // todo: move to IConfiguration
    private const double TickTime = 1.0 / TickRate;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Game background service started.");

        using PeriodicTimer timer = new(TimeSpan.FromSeconds(TickTime));

        try
        {
            do await Tick(stoppingToken);
            while (await timer.WaitForNextTickAsync(stoppingToken));
        }
        catch (OperationCanceledException)
        {
            logger.LogInformation("Game background service is stopping.");
        }
    }

    private async Task Tick(CancellationToken token)
    {
        foreach (var game in gameService.GetGameStates())
            if (!token.IsCancellationRequested)
                await gameHub.Clients.Group(game.LobbyId.ToString())
                    .GameStateUpdate(game.MapToGameStateUpdate());
    }
}