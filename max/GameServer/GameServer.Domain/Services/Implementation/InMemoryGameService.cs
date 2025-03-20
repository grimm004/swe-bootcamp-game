using System.Collections.Immutable;
using GameServer.Domain.GameModels;

namespace GameServer.Domain.Services.Implementation;

public class InMemoryGameService : IGameService
{
    private readonly Dictionary<Guid, Guid> _userLobbyMap = new();
    private readonly Dictionary<Guid, GameState> _gameStates = new();

    public void StartGame(Guid lobbyId, Guid hostId, IImmutableList<Guid> playerIds)
    {
        _gameStates[lobbyId] = new GameState
        {
            LobbyId = lobbyId,
            HostId = hostId,
            Players = playerIds.ToDictionary(playerId => playerId, GamePlayerState.New)
        };

        foreach (var playerId in playerIds)
            _userLobbyMap[playerId] = lobbyId;
    }

    public IEnumerable<GameState> GetGameStates() => _gameStates.Values;

    public GameState? GetGameState(Guid lobbyId) =>
        _gameStates.GetValueOrDefault(lobbyId);

    public void UpdatePlayerState(Guid lobbyId, Guid playerId, GamePlayerState state)
    {
        if (!_gameStates.TryGetValue(lobbyId, out var gameState))
            return;

        if (!gameState.Players.TryGetValue(playerId, out var playerState))
            return;

        gameState.Players[playerId] = playerState with
        {
            Position = state.Position,
            Orientation = state.Orientation
        };
    }

    public void UpdateObjectStates(Guid lobbyId, IReadOnlyCollection<GameObjectState> states)
    {
        if (!_gameStates.TryGetValue(lobbyId, out var gameState))
            return;

        foreach (var state in states)
        {
            if (!gameState.GameObjects.TryGetValue(state.ObjectId, out var objectState))
                objectState = GameObjectState.New(state.ObjectId);

            gameState.GameObjects[state.ObjectId] = objectState with
            {
                Position = state.Position,
                Orientation = state.Orientation,
                Size = state.Size
            };
        }
    }

    public void StopGame(Guid lobbyId)
    {
        if (!_gameStates.TryGetValue(lobbyId, out var gameState))
            return;

        foreach (var playerId in gameState.Players.Keys)
            _userLobbyMap.Remove(playerId);

        _gameStates.Remove(lobbyId);
    }

    public GameState? GetGameStateByUserId(Guid userId)
    {
        if (!_userLobbyMap.TryGetValue(userId, out var lobbyId) || !_gameStates.TryGetValue(lobbyId, out var value))
            return null;

        return value;
    }

    public Guid? GetLobbyIdByUserId(Guid userId)
    {
        if (!_userLobbyMap.TryGetValue(userId, out var lobbyId) || !_gameStates.ContainsKey(lobbyId))
            return null;

        return lobbyId;
    }
}