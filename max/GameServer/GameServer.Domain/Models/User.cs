namespace GameServer.Domain.Models;

public sealed record User
{
    public Guid Id { get; init; }
    public string Username { get; init; } = null!;
    public string DisplayName { get; init; } = null!;
    public IEnumerable<string> Roles { get; init; } = new List<string>();

    public byte[] PasswordSalt { get; init; } = null!;
    public byte[] PasswordHash { get; init; } = null!;
}