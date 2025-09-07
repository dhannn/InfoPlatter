export default function Artifact({ artifact, onDelete }) {
	if (!artifact) return null;
	return (
		<div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, marginBottom: 16, background: "#fff" }}>
			<div style={{ fontSize: 12, color: "#888" }}>
				<span>Captured by: {artifact.capturedBy}</span> | <span>{new Date(artifact.timestamp).toLocaleString()}</span>
			</div>
			<div style={{ margin: "8px 0", fontWeight: 500 }}>{artifact.content}</div>
			{artifact.hasMedia && (
				<div style={{ color: '#0070f3', fontSize: 13 }}>Media attached ({artifact.mediaCount})</div>
			)}
			<div style={{ fontSize: 13, color: "#555", margin: "8px 0" }}>
				<span>Likes: {artifact.likes}</span> | <span>Comments: {artifact.comments}</span> | <span>Shares: {artifact.shares}</span>
			</div>
			<div style={{ fontSize: 12, color: "#888" }}>
				<span>Time spent: {artifact.timeSpent?.toFixed(2)}s</span>
			</div>
			<div style={{ marginTop: 8 }}>
				<a href={artifact.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0070f3', textDecoration: 'underline', marginRight: 12 }}>View Original</a>
				<button onClick={() => onDelete(artifact.id)} style={{ background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Delete</button>
			</div>
		</div>
	);
}

