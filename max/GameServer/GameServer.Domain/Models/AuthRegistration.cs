namespace GameServer.Domain.Models;

public class AuthRegistration
{
    public string Username { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string DisplayName { get; set; } = null!;
}