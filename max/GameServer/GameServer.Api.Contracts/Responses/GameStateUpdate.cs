namespace GameServer.Api.Contracts.Responses;

public record GameStateUpdate(IEnumerable<GamePlayerStateUpdate> PlayerStates, IEnumerable<GameObjectStateUpdate> ObjectStates);
