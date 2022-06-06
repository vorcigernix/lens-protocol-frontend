/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from "react";
import {
	createClient,
	searchProfiles,
	recommendProfiles,
	getPublications,
} from "../api";
import { trimString, generateRandomColor } from "../utils";
import { SearchButton, SearchInput, Placeholders } from "../components";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
	const [profiles, setProfiles] = useState([]);
	const [loadingState, setLoadingState] = useState("loading");
	const [searchString, setSearchString] = useState("");

	useEffect(() => {
		getRecommendedProfiles();
	}, []);

	async function getRecommendedProfiles() {
		try {
			const urqlClient = await createClient();
			const response = await urqlClient.query(recommendProfiles).toPromise();
			const profileData = await Promise.all(
				response.data.recommendedProfiles.map(async (profile) => {
					const pub = await urqlClient
						.query(getPublications, { id: profile.id, limit: 1 })
						.toPromise();
					profile.publication = pub.data.publications.items[0];
					profile.backgroundColor = generateRandomColor();
					return profile;
				})
			);
			setProfiles(profileData);
			setLoadingState("loaded");
		} catch (err) {
			console.log("error fetching recommended profiles: ", err);
		}
	}

	async function searchForProfile() {
		try {
			const urqlClient = await createClient();
			const response = await urqlClient
				.query(searchProfiles, {
					query: searchString,
					type: "PROFILE",
				})
				.toPromise();
			const profileData = await Promise.all(
				response.data.search.items.map(async (profile) => {
					const pub = await urqlClient
						.query(getPublications, { id: profile.profileId, limit: 1 })
						.toPromise();
					profile.id = profile.profileId;
					profile.backgroundColor = generateRandomColor();
					profile.publication = pub.data.publications.items[0];
					return profile;
				})
			);

			setProfiles(profileData);
		} catch (err) {
			console.log("error searching profiles...", err);
		}
	}

	function handleKeyDown(e) {
		if (e.key === "Enter") {
			searchForProfile();
		}
	}

	return (
		<div className='w-[900px] mx-auto pb-12'>
			<div className='pt-10 pb-8'>
				<SearchInput
					placeholder='Search'
					onChange={(e) => setSearchString(e.target.value)}
					value={searchString}
					onKeyDown={handleKeyDown}
				/>
				<SearchButton onClick={searchForProfile} buttonText='SEARCH PROFILES' />
			</div>
			<div className='flex flex-col'>
				{loadingState === "loading" && <Placeholders number={6} />}
				{profiles.map((profile, index) => (
					<Link href={`/profile/${profile.id}`} key={index}>
						<a>
							<div className='bg-white mt-3 rounded-xl border p-5'>
								<div className='flex flex-row'>
									{profile.picture && profile.picture.original ? (
										<img
											src={profile.picture.original.url}
											className='w-12 h-12 rounded-full'
											alt="profile's avatar"
										/>
									) : (
										<div className='' />
									)}

									<div className='ml-3'>
										<h3 className='mb-1'>{profile.name}</h3>
										<p className='mb-1 text-fuchsia-700'>{profile.handle}</p>
									</div>
								</div>
								<div>
									<p className='mt-6 mb-1'>
										{trimString(profile.publication?.metadata.content, 200)}
									</p>
								</div>
							</div>
						</a>
					</Link>
				))}
			</div>
		</div>
	);
}
