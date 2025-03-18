namespace GameServer.Domain.Models;

public sealed record AuthCredentials
{
    public string Username { get; init; } = null!;
    public string Password { get; init; } = null!;
}