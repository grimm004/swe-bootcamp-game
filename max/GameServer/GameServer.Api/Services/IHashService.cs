namespace GameServer.Api.Services;

public interface IHashService
{
    byte[] HashData(byte[] data);
}