'use client'

import React, { useEffect, useState } from "react";
import Artifact from "./Artifact";

export default function ArtifactList() {
	const [artifacts, setArtifacts] = useState([]);

	// Load artifacts from localStorage
	useEffect(() => {
		const stored = localStorage.getItem("artifacts");

		if (stored) {
			try {
				setArtifacts(JSON.parse(stored));
				
			} catch {
				setArtifacts([]);
			}
		}
	}, []);

	// Delete artifact by id
	const handleDelete = (id) => {
		const updated = artifacts.filter((a) => a.id !== id);
		setArtifacts(updated);
		localStorage.setItem("artifacts", JSON.stringify(updated));
	};

	if (!artifacts.length) {
		return <>
			<h1 className='text-5xl font-bold'>Artifacts</h1>
			<div style={{ color: '#888', margin: '32px 0', textAlign: 'center' }}>No artifacts collected yet.</div>;
		</>
	}

	return (
		<div>
			<h1 className='text-5xl font-bold'>Artifacts</h1>
			<p>Here is what we collected!</p>
			{artifacts.map((artifact) => (
				<Artifact key={artifact.id} artifact={artifact} onDelete={handleDelete} />
			))}
		</div>
	);
}
