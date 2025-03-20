using GameServer.Api.Contracts.Responses;
using GameServer.Domain.GameModels;

namespace GameServer.Api.Mappers;

internal static class GameMappers
{
    public static GamePlayerState MapToGamePlayerState(this GamePlayerStateUpdate playerState) =>
        new(Guid.Parse(playerState.PlayerId), playerState.Position.MapToVector3(), playerState.Orientation.MapToQuaternion());

    public static GamePlayerStateUpdate MapToGamePlayerStateUpdate(this GamePlayerState playerState) =>
        new(playerState.PlayerId.ToString(), playerState.Position.MapToVector3(), playerState.Orientation.MapToQuaternion());

    public static GameObjectState MapToGameObjectState(this GameObjectStateUpdate objectState) =>
        new(objectState.ObjectId, objectState.Position.MapToVector3(), objectState.Orientation.MapToQuaternion(), objectState.Size.MapToVector3());

    public static GameObjectStateUpdate MapToGameObjectStateUpdate(this GameObjectState objectState) =>
        new(objectState.ObjectId, objectState.Position.MapToVector3(), objectState.Orientation.MapToQuaternion(), objectState.Size.MapToVector3());

    public static GameStateUpdate MapToGameStateUpdate(this GameState gameState) =>
        new(
            gameState.Players.Values.Select(MapToGamePlayerStateUpdate),
            gameState.GameObjects.Values.Select(MapToGameObjectStateUpdate));
}