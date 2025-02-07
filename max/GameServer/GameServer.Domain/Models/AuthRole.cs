namespace GameServer.Domain.Models;

public record AuthRole
{
    public Guid Id { get; init; }
    public required string Name { get; init; }
    public required string Description { get; init; }
}