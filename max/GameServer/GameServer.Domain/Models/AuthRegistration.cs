namespace GameServer.Domain.Models;

public sealed record AuthRegistration
{
    public string Username { get; init; } = null!;
    public string Password { get; init; } = null!;
    public string DisplayName { get; init; } = null!;
}