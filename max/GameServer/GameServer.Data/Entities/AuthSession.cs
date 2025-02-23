namespace GameServer.Data.Entities;

internal class AuthSession
{
    public Guid Id { get; set; }
    public required Guid UserId { get; set; }
    public required byte[] TokenHash { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }

    public User? User { get; set; }
}