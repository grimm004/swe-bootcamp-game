using System.Numerics;

namespace GameServer.Domain.GameModels;

public record GameObjectState(string ObjectId, Vector3 Position, Quaternion Orientation, Vector3 Size)
{
    public static GameObjectState New(string objectId) => new(objectId, Vector3.Zero, Quaternion.Identity, Vector3.One);
}