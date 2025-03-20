using GameServer.Api.Contracts.Primitives;

namespace GameServer.Api.Contracts.Responses;

public record GamePlayerStateUpdate(string PlayerId, Vector3 Position, Quaternion Orientation);