/* eslint-disable @next/next/no-img-element */
import { useRouter } from "next/router";
import { useState, useEffect, useContext } from "react";
import {
	createClient,
	getPublications,
	getProfiles,
	doesFollow as doesFollowQuery,
	createUnfollowTypedData,
} from "../../api";
import { ethers } from "ethers";
import { AppContext } from "../../context";
import { getSigner, generateRandomColor } from "../../utils";

import ABI from "../../abi";
const LENS_HUB_CONTRACT_ADDRESS = "0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d";

export default function Profile() {
	const [profile, setProfile] = useState();
	const [publications, setPublications] = useState([]);
	const [doesFollow, setDoesFollow] = useState();
	const [loadedState, setLoadedState] = useState("");
	const router = useRouter();
	const context = useContext(AppContext);
	const { id } = router.query;
	const { userAddress } = context;

	useEffect(() => {
		if (id) {
			fetchProfile();
		}
		if (id && userAddress) {
			checkDoesFollow();
		}
	}, [id, userAddress]);

	async function unfollow() {
		try {
			const client = await createClient();
			const response = await client
				.mutation(createUnfollowTypedData, {
					request: { profile: id },
				})
				.toPromise();
			const typedData = response.data.createUnfollowTypedData.typedData;
			const contract = new ethers.Contract(
				typedData.domain.verifyingContract,
				ABI,
				getSigner()
			);

			const tx = await contract.burn(typedData.value.tokenId);
			setTimeout(() => {
				setDoesFollow(false);
			}, 2500);
			await tx.wait();
			console.log(`successfully unfollowed ... ${profile.handle}`);
		} catch (err) {
			console.log("error:", err);
		}
	}

	async function fetchProfile() {
		try {
			const urqlClient = await createClient();
			const returnedProfile = await urqlClient
				.query(getProfiles, { id })
				.toPromise();
			const profileData = returnedProfile.data.profiles.items[0];
			profileData.color = generateRandomColor();
			setProfile(profileData);

			const pubs = await urqlClient
				.query(getPublications, { id, limit: 50 })
				.toPromise();

			setPublications(pubs.data.publications.items);
			setLoadedState("loaded");
		} catch (err) {
			console.log("error fetching profile...", err);
		}
	}

	async function checkDoesFollow() {
		const urqlClient = await createClient();
		const response = await urqlClient
			.query(doesFollowQuery, {
				request: {
					followInfos: [
						{
							followerAddress: userAddress,
							profileId: id,
						},
					],
				},
			})
			.toPromise();
		setDoesFollow(response.data.doesFollow[0].follows);
	}

	async function followUser() {
		const contract = new ethers.Contract(
			LENS_HUB_CONTRACT_ADDRESS,
			ABI,
			getSigner()
		);

		try {
			const tx = await contract.follow([id], [0x0]);
			setTimeout(() => {
				setDoesFollow(true);
			}, 2500);
			await tx.wait();
			console.log(`successfully followed ... ${profile.handle}`);
		} catch (err) {
			console.log("error: ", err);
		}
	}

	if (!profile) return null;

	return (
		<div className='w-[900px] mx-auto pt-12'>
			{profile.coverPicture && (
				<img
					className={`w-[900px] max-h-[300px] h-[300px] overflow-hidden bg-cover bg-center rounded-2xl bg-[${profile.color}]`}
					src={profile.coverPicture?.original.url}
					alt='cover picture'
				/>
			)}
			<div className='mt-5 flex flex-row'>
				<div>
					{profile.profilePicture ? (
						<img
							className={`w-[200px] h-[200px] max-w-[200px] rounded-2xl border-8 border-white bg-[${profile.color}]`}
							src={profile.picture?.original?.url}
							alt='profile picture'
						/>
					) : (
						<div
							className={`w-[200px] h-[200px] max-w-[200px] rounded-2xl border-8 border-white bg-[${profile.color}]`}
						/>
					)}
					<h3 className='mt-4 mb-1'>{profile.name}</h3>
					<p className='mb-1 text-fuchsia-500'>{profile.handle}</p>
					<div>
						{userAddress ? (
							doesFollow ? (
								<button
									onClick={unfollow}
									className='border-2 border-fuchsia-500 outline-none mt-4 text-fuchsia-500 p-3 rounded-md cursor-pointer text-sm font-bold transition-colors w-full tracking-tight hover:text-white hover:bg-fuchsia-500'>
									Unfollow
								</button>
							) : (
								<button
									onClick={followUser}
									className='border-2 border-fuchsia-500 outline-none mt-4 text-fuchsia-500 p-3 rounded-md cursor-pointer text-sm font-bold transition-colors w-full tracking-tight hover:text-white hover:bg-fuchsia-500'>
									Follow
								</button>
							)
						) : null}
					</div>
				</div>
				<div className='ml-5 flex flex-1 flex-col'>
					<h3 className='mb-4'>Posts</h3>
					{publications.map((pub, index) => (
						<div
							className='bg-white mb-5 py-1 px-6 rounded-2xl border border-gray-100'
							key={index}>
							<p className='leading-7'>{pub.metadata.content}</p>
						</div>
					))}
					{loadedState === "loaded" && !publications.length && (
						<div className='bg-white border border-gray-100 p-6 rounded-lg'>
							<p className='text-center m-0'>
								<span className='font-semibold'>{profile.handle}</span> has not
								posted yet!
							</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
