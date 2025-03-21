using GameServer.Api.Contracts.Responses;

namespace GameServer.Api.Hubs;

public interface IGameClient
{
    Task GameStateUpdate(GameStateUpdate gameState);
    Task GamePlayerImpulseAction(IEnumerable<GamePlayerImpulseAction> gameState);
    Task PlayerLeft(string playerId);
    Task GameStopped();
}