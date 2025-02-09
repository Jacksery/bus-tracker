import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BusData } from "../services/busService"
import { formatDateTime } from "../utils/dateFormat"
import { useUserStore } from "@/store/userStore";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface BusCardProps {
    bus: BusData;
    onRouteClick: (route: string) => void;
}

export function BusCard({ bus, onRouteClick }: BusCardProps) {
    const { toast } = useToast()

    const { balance, bets, placeBet } = useUserStore();
    const [betAmount, setBetAmount] = useState<number>(1);

    const departureTime = bus.expectedDeparture || bus.scheduledDeparture;

    const isActiveBus = (): boolean => {
        const now = new Date().getTime();
        const departure = new Date(departureTime).getTime();
        const arrival = new Date(bus.scheduledArrival).getTime();
        return departure <= now && now <= arrival;
    };

    const getCurrentDelay = (): number | null => {
        if (!bus.expectedDeparture || !bus.scheduledDeparture) return null;
        const now = new Date().getTime();
        const currentExpected = new Date(bus.expectedDeparture).getTime();
        const currentScheduled = new Date(bus.scheduledDeparture).getTime();

        const totalJourneyTime = new Date(bus.scheduledArrival).getTime() - new Date(bus.scheduledDeparture).getTime();
        const timeElapsed = now - new Date(bus.scheduledDeparture).getTime();
        const journeyProportion = timeElapsed / totalJourneyTime;

        const delay = currentExpected - currentScheduled;
        return Math.round((delay * journeyProportion) / (1000 * 60));
    };

    const renderDelay = () => {
        const delay = getCurrentDelay();
        if (delay === null) return null;
        if (Math.abs(delay) < 1) return <Badge variant="outline">On Time</Badge>;
        return delay > 0
            ? <Badge variant="destructive">{delay} mins behind</Badge>
            : <Badge variant="default">{Math.abs(delay)} mins ahead</Badge>;
    };

    const existingBet = bets.find(b => b.busId === bus.id && !b.resolved);
    const canPlaceBet = isActiveBus() && !existingBet && balance >= betAmount;

    const handlePlaceBet = (prediction: 'early' | 'late') => {
        if (!canPlaceBet) return;

        placeBet({
            busId: bus.id,
            amount: betAmount,
            prediction,
            routeNumber: bus.routeNumber
        });

        toast({
            title: "Bet Placed!",
            description: `£${betAmount} on bus ${bus.routeNumber} arriving ${prediction}`,
        });
    };

    const routeNumberClass = isActiveBus()
        ? "bg-green-500 text-white"
        : "bg-red-500 text-white";

    return (
        <Card className="mb-4 hover:shadow-md">
            <CardContent className="p-4 sm:p-6">
                {/* Header - Route Number and Status */}
                <div className="flex flex-wrap items-center gap-3 mb-4 sm:mb-6">
                    <button
                        onClick={() => onRouteClick(bus.routeNumber)}
                        className={`${routeNumberClass} rounded-md px-4 py-1.5 sm:px-5 sm:py-2 hover:opacity-90 transition-opacity text-xl sm:text-2xl font-bold relative`}
                    >
                        {bus.routeNumber}
                    </button>
                    {isActiveBus() && renderDelay()}
                </div>

                {/* Main Content */}
                <div className="grid gap-4 sm:gap-6">
                    {/* Journey Info */}
                    <div className="grid gap-4 sm:grid-cols-2 sm:gap-x-8">
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">From</p>
                                <p className="text-sm font-medium break-words">{bus.origin}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">To</p>
                                <p className="text-sm font-medium break-words">{bus.destination}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Departure</p>
                                <p className="text-sm font-medium">{formatDateTime(departureTime)}</p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Arrival</p>
                                <p className="text-sm font-medium">{formatDateTime(bus.scheduledArrival)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t gap-4">
                        <div className="grid grid-cols-2 sm:flex gap-4 sm:gap-6">
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Direction</p>
                                <p className="text-sm">{bus.direction}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Operator</p>
                                <p className="text-sm">{bus.operator}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Bus ID</p>
                                <p className="text-sm">{bus.vehicleId}</p>
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Last updated: {formatDateTime(bus.recordedAt)}
                        </div>
                    </div>

                    {/* Add betting controls */}
                    {isActiveBus() && (
                        <div className="mt-4 pt-4 border-t">
                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    min="1"
                                    max={balance}
                                    value={betAmount}
                                    onChange={(e) => setBetAmount(Number(e.target.value))}
                                    className="w-20 px-2 py-1 border rounded"
                                />
                                <Button
                                    onClick={() => handlePlaceBet('early')}
                                    disabled={!canPlaceBet}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Bet Early (2x)
                                </Button>
                                <Button
                                    onClick={() => handlePlaceBet('late')}
                                    disabled={!canPlaceBet}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Bet Late (2x)
                                </Button>
                            </div>
                            {existingBet && (
                                <p className="text-sm text-muted-foreground mt-2">
                                    You bet £{existingBet.amount} on this bus arriving {existingBet.prediction}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
