// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title OverCall: the whole room calls the next ball. Points only, no money.
contract OverCall {
    // Picks: 1 = dot, 2 = 1-3 runs, 3 = boundary, 4 = wicket.
    uint8 public constant PICKS = 4;
    uint256 public constant BASE_POINTS = 10;
    uint256 public constant STREAK_BONUS = 5;
    uint256 public constant MAX_STREAK_BONUS = 4;

    struct Ball {
        uint64 closesAt;
        uint8 result; // 0 until settled
        bool settled;
    }

    address public immutable host;
    uint256 public ballCount; // id of the latest ball; 0 = none yet

    mapping(uint256 => Ball) public balls;
    mapping(uint256 => mapping(address => uint8)) public pickOf;
    mapping(uint256 => address[]) private callers;
    mapping(uint256 => uint256[5]) private tally;

    address[] private players;
    mapping(address => string) public nameOf;
    mapping(address => uint256) public points;
    mapping(address => uint256) public streak;

    event Joined(address indexed player, string name);
    event BallOpened(uint256 indexed ballId, uint64 closesAt);
    event Called(uint256 indexed ballId, address indexed player, uint8 pick);
    event BallSettled(uint256 indexed ballId, uint8 result, uint256 correct);

    error NotHost();
    error NotJoined();
    error AlreadyJoined();
    error BadName();
    error BadPick();
    error NoOpenBall();
    error WindowClosed();
    error AlreadyCalled();
    error BallStillOpen();
    error AlreadySettled();

    modifier onlyHost() {
        if (msg.sender != host) revert NotHost();
        _;
    }

    constructor() {
        host = msg.sender;
    }

    function join(string calldata name) external {
        uint256 len = bytes(name).length;
        if (len == 0 || len > 20) revert BadName();
        if (bytes(nameOf[msg.sender]).length != 0) revert AlreadyJoined();
        nameOf[msg.sender] = name;
        players.push(msg.sender);
        emit Joined(msg.sender, name);
    }

    /// Opens the next ball. The previous ball must be settled first.
    function openBall(uint64 windowSeconds) external onlyHost {
        uint256 id = ballCount;
        if (id != 0 && !balls[id].settled) revert BallStillOpen();
        id += 1;
        ballCount = id;
        uint64 closesAt = uint64(block.timestamp) + windowSeconds;
        balls[id].closesAt = closesAt;
        emit BallOpened(id, closesAt);
    }

    function call(uint8 pick) external {
        if (pick == 0 || pick > PICKS) revert BadPick();
        if (bytes(nameOf[msg.sender]).length == 0) revert NotJoined();
        uint256 id = ballCount;
        Ball storage b = balls[id];
        if (id == 0 || b.settled) revert NoOpenBall();
        if (block.timestamp >= b.closesAt) revert WindowClosed();
        if (pickOf[id][msg.sender] != 0) revert AlreadyCalled();
        pickOf[id][msg.sender] = pick;
        callers[id].push(msg.sender);
        tally[id][pick] += 1;
        emit Called(id, msg.sender, pick);
    }

    /// Settles the current ball. Correct callers score 10 plus 5 per prior streak step
    /// (capped); wrong callers lose their streak. Players who skipped keep theirs.
    function settle(uint8 result) external onlyHost {
        if (result == 0 || result > PICKS) revert BadPick();
        uint256 id = ballCount;
        Ball storage b = balls[id];
        if (id == 0) revert NoOpenBall();
        if (b.settled) revert AlreadySettled();
        b.settled = true;
        b.result = result;
        address[] storage list = callers[id];
        uint256 correct;
        for (uint256 i = 0; i < list.length; i++) {
            address p = list[i];
            if (pickOf[id][p] == result) {
                uint256 s = streak[p];
                uint256 bonus = s > MAX_STREAK_BONUS ? MAX_STREAK_BONUS : s;
                points[p] += BASE_POINTS + bonus * STREAK_BONUS;
                streak[p] = s + 1;
                correct++;
            } else {
                streak[p] = 0;
            }
        }
        emit BallSettled(id, result, correct);
    }

    function tallyOf(uint256 ballId) external view returns (uint256[5] memory) {
        return tally[ballId];
    }

    function playerCount() external view returns (uint256) {
        return players.length;
    }

    /// Everything the projector needs in one read.
    function board()
        external
        view
        returns (address[] memory addrs, string[] memory names, uint256[] memory pts, uint256[] memory streaks)
    {
        uint256 n = players.length;
        addrs = players;
        names = new string[](n);
        pts = new uint256[](n);
        streaks = new uint256[](n);
        for (uint256 i = 0; i < n; i++) {
            names[i] = nameOf[players[i]];
            pts[i] = points[players[i]];
            streaks[i] = streak[players[i]];
        }
    }
}
