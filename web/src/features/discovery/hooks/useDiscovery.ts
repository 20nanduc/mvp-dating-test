import { useEffect, useMemo, useState } from "react";
import useSWRInfinite from "swr/infinite";

import { useAuth } from "@/features/auth/context/AuthProvider";

import { fetchDiscoveryPage } from "../services/discoveryService";

import type {
    DiscoveryPageResponse,
} from "../schemas/discovery.schemas";

export function useDiscovery() {
    const { user } = useAuth();

    const uid = user?.auth_id;

    const [currentIndex, setCurrentIndex] = useState(0);

    const {
        data,
        error,
        isLoading,
        isValidating,
        size,
        setSize,
        mutate,
    } = useSWRInfinite<DiscoveryPageResponse>(
        (
            pageIndex,
            previousPage: DiscoveryPageResponse | null,
        ) => {
            if (!uid) {
                return null;
            }

            if (
                pageIndex > 0 &&
                (!previousPage?.hasMore || !previousPage.nextCursor)
            ) {
                return null;
            }

            return [
                "discovery",
                uid,
                pageIndex === 0
                    ? null
                    : previousPage!.nextCursor,
            ] as const;
        },

        ([, , cursor]) =>
            fetchDiscoveryPage(typeof cursor === "string" ? cursor : null),

        {
            revalidateOnFocus: true,
            revalidateOnReconnect: true,
            persistSize: true,
        },
    );

    // Combine paginated responses.
    // Remove duplicate profiles.
    const profiles = useMemo(() => {
        const seen = new Set<string>();

        return (data ?? [])
            .flatMap((page) => page.items)
            .filter((profile) => {
                if (seen.has(profile.id)) {
                    return false;
                }

                seen.add(profile.id);

                return true;
            });
    }, [data]);

    const hasMore = Boolean(
        data?.[data.length - 1]?.hasMore,
    );

    // Prefetch another page when few profiles remain.
    useEffect(() => {
        if (
            uid &&
            data &&
            data.length === size &&
            hasMore &&
            !isValidating &&
            profiles.length - currentIndex <= 2
        ) {
            void setSize(size + 1);
        }
    }, [
        uid,
        data,
        size,
        hasMore,
        isValidating,
        profiles.length,
        currentIndex,
        setSize,
    ]);

    /**
     * Called only after successful request creation.
     *
     * Removing the current profile shifts the next
     * eligible profile into the same index.
     *
     * We intentionally DO NOT increment currentIndex.
     */
    async function removeRequestedProfile(
        receiverId: string,
    ) {
        await mutate(
            (pages) =>
                pages?.map((page) => ({
                    ...page,
                    items: page.items.filter(
                        (profile) => profile.id !== receiverId,
                    ),
                })),
            {
                revalidate: false,
            },
        );
    }

    return {
        currentProfile: profiles[currentIndex] ?? null,

        nextProfile: profiles[currentIndex + 1] ?? null,

        profiles,

        isLoading,
        isValidating,
        error,
        hasMore,
        currentIndex,

        onNext: () => {
            setCurrentIndex((index) => index + 1);
        },

        onRestart: () => {
            setCurrentIndex(0);
        },

        removeRequestedProfile,

        revalidate: () => mutate(),
    };
}