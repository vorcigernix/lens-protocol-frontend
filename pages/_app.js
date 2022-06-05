/* eslint-disable @next/next/no-img-element */
import "../styles/globals.css";
import { useState, useEffect } from "react";
import { ethers, providers } from "ethers";
import Link from "next/link";
import { useRouter } from "next/router";
import {
	createClient,
	STORAGE_KEY,
	authenticate as authenticateMutation,
	getChallenge,
} from "../api";
import { parseJwt, refreshAuthToken } from "../utils";
import { AppContext } from "../context";

function MyApp({ Component, pageProps }) {
	const [connected, setConnected] = useState(true);
	const [userAddress, setUserAddress] = useState();
	const router = useRouter();

	useEffect(() => {
		refreshAuthToken();
		async function checkConnection() {
			const provider = new ethers.providers.Web3Provider(window.ethereum);
			const addresses = await provider.listAccounts();
			if (addresses.length) {
				setConnected(true);
				setUserAddress(addresses[0]);
			} else {
				setConnected(false);
			}
		}
		checkConnection();
		listenForRouteChangeEvents();
	}, []);

	async function listenForRouteChangeEvents() {
		router.events.on("routeChangeStart", () => {
			refreshAuthToken();
		});
	}

	async function signIn() {
		try {
			const accounts = await window.ethereum.send("eth_requestAccounts");
			setConnected(true);
			const account = accounts.result[0];
			setUserAddress(account);
			const urqlClient = await createClient();
			const response = await urqlClient
				.query(getChallenge, {
					address: account,
				})
				.toPromise();
			const provider = new providers.Web3Provider(window.ethereum);
			const signer = provider.getSigner();
			const signature = await signer.signMessage(response.data.challenge.text);
			const authData = await urqlClient
				.mutation(authenticateMutation, {
					address: account,
					signature,
				})
				.toPromise();
			const { accessToken, refreshToken } = authData.data.authenticate;
			const accessTokenData = parseJwt(accessToken);

			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					accessToken,
					refreshToken,
					exp: accessTokenData.exp,
				})
			);
		} catch (err) {
			console.log("error: ", err);
		}
	}

	return (
		<AppContext.Provider
			value={{
				userAddress,
			}}>
			<div>
				<nav className='bg-white flex py-4 px-8'>
					<div className='w-[900px] flex mx-auto'>
						<div className='flex items-center'>
							<Link href='/'>
								<a>
									<img src='/icon.svg' className='h-9 mr-10' alt='icon' />
								</a>
							</Link>
							<Link href='/'>
								<a>
									<p className='mr-10 font-semibold text-sm'>Home</p>
								</a>
							</Link>
							<Link href='/profiles'>
								<a>
									<p className='mr-10 font-semibold text-sm'>
										Explore Profiles
									</p>
								</a>
							</Link>
						</div>
						<div className='flex flex-row justify-end items-center flex-1'>
							{!connected && (
								<button
									className='border-0 outline-none ml-4 text-fuchsia-700 p-3 rounded-2xl cursor-pointer text-sm font-medium bg-fuchsia-300 transition-all duration-200 ease-in-out w-40 tracking-tight'
									onClick={signIn}>
									Sign in
								</button>
							)}
						</div>
					</div>
				</nav>
				<Component {...pageProps} />
			</div>
		</AppContext.Provider>
	);
}

export default MyApp;
