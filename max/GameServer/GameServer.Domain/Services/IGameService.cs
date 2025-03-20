using System.Collections.Immutable;
using GameServer.Domain.GameModels;

namespace GameServer.Domain.Services;

public interface IGameService
{
    void StartGame(Guid lobbyId, IImmutableList<Guid> playerIds);
    IEnumerable<GameState> GetGameStates();
    void UpdatePlayerState(Guid lobbyId, Guid playerId, GamePlayerState state);
    void UpdateObjectStates(Guid lobbyId, IReadOnlyCollection<GameObjectState> states);
    void StopGame(Guid lobbyId);
    Guid? GetLobbyIdByUserId(Guid userId);
}