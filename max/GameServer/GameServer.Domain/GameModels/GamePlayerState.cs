using System.Numerics;

namespace GameServer.Domain.GameModels;

public record GamePlayerState(Guid PlayerId, Vector3 Position, Quaternion Orientation)
{
    public static GamePlayerState New(Guid userId) => new(userId, Vector3.Zero, Quaternion.Identity);
}