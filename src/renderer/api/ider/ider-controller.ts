import { TrackListArgs, TrackListResponse } from '../types';
import { iderApiClient } from '/@/renderer/api/ider/ider-api';

const getTrackList = async (args: TrackListArgs): Promise<TrackListResponse> => {
    const { apiClientProps, query } = args;

    const res = await iderApiClient({
        server: null,
        signal: apiClientProps.signal,
        url: 'http://localhost:8001',
    }).getTrackList({
        query: {
            track_id: query.track_id,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to get track list');
    }

    return {
        items: res.body.data,
        startIndex: 0,
        totalRecordCount: Number(res.body.headers.get('x-total-count') || 0),
    };
};

export const iderController = {
    getTrackList,
};
