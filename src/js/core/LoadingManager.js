import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { LoadingTrackerEntry } from './LoadingTrackerEntry.js';
import { UIManager } from './UIManager.js';
//import Swal from 'sweetalert2';

export class LoadingManager
{

	constructor(world)
	{
		this.world = world;
        this.gltfLoader = new GLTFLoader();

        this.firstLoad = true;
        this.onFinishedCallback;
        this.loadingTracker = [];

        this.world.setTimeScale(0);
        UIManager.setUserInterfaceVisible(false);
        UIManager.setLoadingScreenVisible(true);
	}

	loadGLTF(path, onLoadingFinished)
	{
		let trackerEntry = this.addLoadingEntry(path);

		this.gltfLoader.load(path,
		(gltf)  =>
		{
			onLoadingFinished(gltf);
			this.doneLoading(trackerEntry);
		},
		(xhr) =>
		{
			if ( xhr.lengthComputable )
			{
				trackerEntry.progress = xhr.loaded / xhr.total;
			}
		},
		(error)  =>
		{
			console.error(error);
		});
	}

	addLoadingEntry(path)
	{
		let entry = new LoadingTrackerEntry(path);
		this.loadingTracker.push(entry);

		return entry;
	}

	doneLoading(trackerEntry)
	{
		trackerEntry.finished = true;
		trackerEntry.progress = 1;

		if (this.isLoadingDone())
		{
			if (this.onFinishedCallback !== undefined) 
			{
				this.onFinishedCallback();
			}
			else
			{
				UIManager.setUserInterfaceVisible(true);
			}

			UIManager.setLoadingScreenVisible(false);
		}
	}

	createWelcomeScreenCallback(scenario)
	{
		if (this.onFinishedCallback === undefined)
		{
			this.onFinishedCallback = () =>
			{
				this.world.update(1, 1);
	
				Swal.fire({
					title: scenario.descriptionTitle,
					html: scenario.descriptionContent,
					confirmButtonText: 'Play',
					buttonsStyling: false,
					onClose: () => {
						this.world.setTimeScale(1);
						UIManager.setUserInterfaceVisible(true);
					}
				});
			};
		}
	}

	getLoadingPercentage()
	{
		let done = true;
		let total = 0;
		let finished = 0;

		for (const item of this.loadingTracker)
		{
			total++;
			finished += item.progress;
			if (!item.finished) done = false;
		}

		return (finished / total) * 100;
	}

	isLoadingDone()
	{
		for (const entry of this.loadingTracker) {
			if (!entry.finished) return false;
		}
		return true;
	}
}