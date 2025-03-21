namespace GameServer.Api.Hubs;

public interface ILobbyClient
{
    Task PlayerJoined(string playerId);
    Task PlayerLeft(string playerId);
    Task GameStarted();
    Task LobbyDisbanded();
}