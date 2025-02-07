namespace GameServer.Domain.Models;

public record AuthSession
{
    public Guid Id { get; set; }
    public User User { get; set; } = null!;
    public byte[] TokenData { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
}