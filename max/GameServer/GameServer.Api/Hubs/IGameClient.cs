using GameServer.Api.Contracts.Responses;

namespace GameServer.Api.Hubs;

public interface IGameClient
{
    Task GameStateUpdate(GameStateUpdate gameState);
}