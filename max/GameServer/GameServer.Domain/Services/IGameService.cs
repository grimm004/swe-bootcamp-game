using System.Collections.Immutable;
using GameServer.Domain.GameModels;

namespace GameServer.Domain.Services;

public interface IGameService
{
    void StartGame(Guid lobbyId, Guid hostId, IImmutableList<Guid> playerIds);
    IEnumerable<GameState> GetGameStates();
    void UpdatePlayerState(Guid lobbyId, Guid playerId, GamePlayerState state);
    void UpdateObjectStates(Guid lobbyId, IReadOnlyCollection<GameObjectState> states);
    void StopGame(Guid lobbyId);
    GameState? GetGameStateByUserId(Guid userId);
    Guid? GetLobbyIdByUserId(Guid userId);
}