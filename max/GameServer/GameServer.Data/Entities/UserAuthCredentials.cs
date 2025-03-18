namespace GameServer.Data.Entities;

internal sealed class UserAuthCredentials
{
    public required byte[] PasswordSalt { get; set; }
    public required byte[] PasswordHash { get; set; }
}