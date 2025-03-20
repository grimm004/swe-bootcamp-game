namespace GameServer.Domain.GameModels;

public class GameState
{
    public required Guid LobbyId { get; init; }
    public required IDictionary<Guid, GamePlayerState> Players { get; init; }
    public IDictionary<string, GameObjectState> GameObjects { get; } = new Dictionary<string, GameObjectState>();
}