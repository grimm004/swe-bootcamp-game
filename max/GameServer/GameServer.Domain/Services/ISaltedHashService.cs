namespace GameServer.Domain.Services;

public interface ISaltedHashService
{
    byte[] HashData(byte[] data, byte[]? salt = null);
    byte[] GenerateRandomBytes(int length);
}