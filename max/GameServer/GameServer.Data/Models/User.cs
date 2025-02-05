using System.ComponentModel.DataAnnotations;

namespace GameServer.Data.Models;

public class User
{
    public Guid Id { get; set; }

    public required string Username { get; set; }

    public required string Email { get; set; }

    public string? DisplayName { get; set; }

    public required byte[] PasswordHash { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}