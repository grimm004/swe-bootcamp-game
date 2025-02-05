using System.Security.Cryptography;

namespace GameServer.Api.Services;

public class SaltedSha512HashService(byte[] salt) : IHashService
{
    public byte[] HashData(byte[] data) => GenerateSaltedHash(data, salt);

    private static byte[] GenerateSaltedHash(byte[] data, byte[] salt)
    {
        var plainTextWithSaltBytes = new byte[data.Length + salt.Length];

        for (var i = 0; i < data.Length; i++)
            plainTextWithSaltBytes[i] = data[i];
        for (var i = 0; i < salt.Length; i++)
            plainTextWithSaltBytes[data.Length + i] = salt[i];

        return SHA512.HashData(plainTextWithSaltBytes);
    }
}