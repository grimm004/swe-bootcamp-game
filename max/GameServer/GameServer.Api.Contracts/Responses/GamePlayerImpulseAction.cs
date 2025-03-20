using GameServer.Api.Contracts.Primitives;

namespace GameServer.Api.Contracts.Responses;

public record GamePlayerImpulseAction(string PlayerId, string ObjectId, Vector3 Position, Vector3 Force);