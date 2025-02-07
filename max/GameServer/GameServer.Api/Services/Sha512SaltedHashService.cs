using System.Security.Cryptography;
using GameServer.Domain.Services;

namespace GameServer.Api.Services;

public class Sha512SaltedHashService(byte[] commonSalt) : ISaltedHashService
{
    private byte[] GetHashSalt(byte[] salt)
    {
        var hashSalt = new byte[commonSalt.Length + salt.Length];

        for (var i = 0; i < commonSalt.Length; i++)
            hashSalt[i] = commonSalt[i];
        for (var i = 0; i < salt.Length; i++)
            hashSalt[commonSalt.Length + i] = salt[i];

        return hashSalt;
    }

    public byte[] HashData(byte[] data, byte[]? salt = null) => GenerateSaltedHash(data, salt is null ? commonSalt : GetHashSalt(salt));

    public byte[] GenerateRandomBytes(int length)
    {
        var salt = new byte[length];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(salt);
        return salt;
    }

    private static byte[] GenerateSaltedHash(byte[] data, byte[]? salt)
    {
        if (salt is null)
            return SHA512.HashData(data);

        var plainTextWithSaltBytes = new byte[data.Length + salt.Length];

        for (var i = 0; i < data.Length; i++)
            plainTextWithSaltBytes[i] = data[i];
        for (var i = 0; i < salt.Length; i++)
            plainTextWithSaltBytes[data.Length + i] = salt[i];

        return SHA512.HashData(plainTextWithSaltBytes);
    }
}