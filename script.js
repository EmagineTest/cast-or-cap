const { AuthKit } = window.farcasterAuth;

let claims = []; // In-memory store (replace with backend if needed)
let leaderboard = {}; // user -> votes earned

const authKit = new AuthKit({
  relayUrl: 'https://relay.farcaster.xyz',
  rpcUrl: 'https://mainnet.optimism.io',
});

document.getElementById('login-btn').addEventListener('click', async () => {
  const result = await authKit.signIn();
  if (result?.username) {
    document.getElementById('user-info').innerText = `Hello, @${result.username}`;
    document.getElementById('user-info').style.display = 'block';
    document.getElementById('login-btn').style.display = 'none';
    document.getElementById('claim-form').style.display = 'block';
    window.farcasterUser = result;
    renderClaims();
    renderLeaderboard();
  }
});

function submitClaim() {
  const user = window.farcasterUser?.username;
  const text = document.getElementById('claim-text').value;
  if (!user || !text) return alert("Missing user or claim!");

  const claim = {
    id: Date.now(),
    text,
    postedBy: user,
    votes: { cast: 0, cap: 0 },
    voters: {} // username -> vote
  };

  claims.unshift(claim);
  document.getElementById('claim-text').value = '';
  renderClaims();
}

function vote(id, type) {
  const user = window.farcasterUser?.username;
  if (!user) return alert("Login first!");

  const claim = claims.find(c => c.id === id);
  if (!claim || claim.voters[user]) return alert("Already voted!");

  claim.voters[user] = type;
  claim.votes[type] += 1;

  // Update leaderboard
  if (!leaderboard[claim.postedBy]) leaderboard[claim.postedBy] = 0;
  leaderboard[claim.postedBy] += 1;

  renderClaims();
  renderLeaderboard();
}

function renderClaims() {
  const container = document.getElementById('claims-feed');
  container.innerHTML = '';

  claims.forEach(c => {
    const div = document.createElement('div');
    div.className = 'claim';
    div.innerHTML = `
      <p><strong>@${c.postedBy}:</strong> ${c.text}</p>
      <p>
        <span class="vote-btn" onclick="vote(${c.id}, 'cast')">🟣 Cast (${c.votes.cast})</span>
        <span class="vote-btn" onclick="vote(${c.id}, 'cap')">🧢 Cap (${c.votes.cap})</span>
      </p>
    `;
    container.appendChild(div);
  });
}

function renderLeaderboard() {
  const sorted = Object.entries(leaderboard).sort((a, b) => b[1] - a[1]);
  const container = document.getElementById('leaderboard');
  container.innerHTML = sorted
    .map(([user, score]) => `<p>@${user}: ${score} votes</p>`)
    .join('');
}