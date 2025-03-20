using GameServer.Api.Contracts.Primitives;

namespace GameServer.Api.Contracts.Responses;

public record GameObjectStateUpdate(string ObjectId, Vector3 Position, Quaternion Orientation, Vector3 Size);