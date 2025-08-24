import type { Abi } from "viem";
import factoryAbi from "../abi/EventFactory.json";
import ticketAbi from "../abi/EventTicket.json";
import resaleAbi from "../abi/ReselIT.json";

export const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY as `0x${string}`;
export const RESELIT_ADDRESS = process.env.NEXT_PUBLIC_RESELIT as `0x${string}`;

export const EventFactoryABI = factoryAbi as Abi;
export const EventTicketABI = ticketAbi as Abi;
export const ReselITABI = resaleAbi as Abi;
