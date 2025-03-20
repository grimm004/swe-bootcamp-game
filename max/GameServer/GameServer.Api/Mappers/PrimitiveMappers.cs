using GameServer.Api.Contracts.Primitives;

namespace GameServer.Api.Mappers;

internal static class PrimitiveMappers
{
    public static System.Numerics.Vector3 MapToVector3(this Vector3 vector) => new System.Numerics.Vector3(vector.X, vector.Y, vector.Z);
    public static Vector3 MapToVector3(this System.Numerics.Vector3 vector) => new Vector3(vector.X, vector.Y, vector.Z);

    public static System.Numerics.Quaternion MapToQuaternion(this Quaternion quat) => new System.Numerics.Quaternion(quat.X, quat.Y, quat.Z, quat.W);
    public static Quaternion MapToQuaternion(this System.Numerics.Quaternion quat) => new Quaternion(quat.X, quat.Y, quat.Z, quat.W);
}