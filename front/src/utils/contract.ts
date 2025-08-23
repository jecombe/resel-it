import factoryAbi from "../abi/EventFactory.json";
import ticketAbi from "../abi/EventTicket.json";
import resaleAbi from "../abi/ReselIT.json";

export const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY as `0x${string}`;
export const RESELIT_ADDRESS = process.env.NEXT_PUBLIC_RESELIT as `0x${string}`;

export const EventFactoryABI = factoryAbi as any;
export const EventTicketABI = ticketAbi as any;
export const ReselITABI = resaleAbi as any;
