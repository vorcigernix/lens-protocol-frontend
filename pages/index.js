/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from "react";
import {
	createClient,
	basicClient,
	searchPublications,
	explorePublications,
} from "../api";
import { trimString, generateRandomColor } from "../utils";
import { SearchButton, SearchInput, Placeholders } from "../components";
import Link from "next/link";

export default function Home() {
	const [posts, setPosts] = useState([]);
	const [loadingState, setLoadingState] = useState("loading");
	const [searchString, setSearchString] = useState("");

	useEffect(() => {
		fetchPosts();
	}, []);

	async function fetchPosts() {
		try {
			const response = await basicClient.query(explorePublications).toPromise();
			const posts = response.data.explorePublications.items.filter((post) => {
				if (post.profile) {
					post.backgroundColor = generateRandomColor();
					return post;
				}
			});
			setPosts(posts);
			setLoadingState("loaded");
		} catch (error) {
			console.log({ error });
		}
	}

	async function searchForPost() {
		setLoadingState("");
		try {
			const urqlClient = await createClient();
			const response = await urqlClient
				.query(searchPublications, {
					query: searchString,
					type: "PUBLICATION",
				})
				.toPromise();
			const postData = response.data.search.items.filter((post) => {
				if (post.profile) {
					post.backgroundColor = generateRandomColor();
					return post;
				}
			});

			setPosts(postData);
			if (!postData.length) {
				setLoadingState("no-results");
			}
		} catch (error) {
			console.log({ error });
		}
	}

	function handleKeyDown(e) {
		if (e.key === "Enter") {
			searchForPost();
		}
	}

	console.log("UI Posts: ", posts);

	return (
		<div className='w-[900px] mx-auto pb-12'>
			<div className='pt-10 pb-8'>
				<SearchInput
					placeholder='Search'
					onChange={(e) => setSearchString(e.target.value)}
					value={searchString}
					onKeyDown={handleKeyDown}
				/>
				<SearchButton buttonText='SEARCH POSTS' onClick={searchForPost} />
			</div>
			<div className='flex flex-col'>
				{loadingState === "no-results" && <h2>No results....</h2>}
				{loadingState === "loading" && <Placeholders number={6} />}
				{posts.map((post, index) => (
					<Link
						href={`/profile/${post.profile.id || post.profile.profileId}`}
						key={index}>
						<a>
							<div className='bg-white mt-3 rounded-xl border p-5'>
								<div className="flex flex-row">
									{post.profile.picture && post.profile.picture.original ? (
										<img
											src={post.profile.picture.original.url}
											className=' w-12 h-12 rounded-full'
											alt="profile's avatar"
										/>
									) : (
										<div className='' />
									)}

									<div className="ml-3">
										<h3 className="mb-1">{post.profile.name}</h3>
										<p className="mb-1 text-fuchsia-700">{post.profile.handle}</p>
									</div>
								</div>
								<div>
									<p className="mt-6 mb-1">
										{trimString(post.metadata.content, 200)}
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
