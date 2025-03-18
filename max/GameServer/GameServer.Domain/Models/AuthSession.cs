namespace GameServer.Domain.Models;

public sealed record AuthSession
{
    public Guid Id { get; init; }
    public User User { get; init; } = null!;
    public byte[] TokenData { get; init; } = null!;
    public DateTime CreatedAt { get; init; }
    public DateTime ExpiresAt { get; init; }
}